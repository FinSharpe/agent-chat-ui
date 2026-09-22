"use client";
import { useMutation } from "@tanstack/react-query";
import { useStreamContext } from "@/providers/Stream";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import { FiDataResponse } from "@/modules/import-data/types/moneyone-raw";
import { convertToMarkdownTable } from "@/lib/convertToMarkdownTable";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  extractHoldingsFromFiData,
  transformHoldingsToMarkdownFormat,
  getAssetTypeName,
} from "../components/modals/HoldingsPreviewModal";

interface ImportHoldingsParams {
  data: FiDataResponse;
  consentType: ConsentType;
}

/**
 * Mutation hook for importing holdings data to chat
 * Formats holdings as markdown table and submits to stream
 */
export function useImportHoldingsMutation() {
  const stream = useStreamContext();

  return useMutation({
    mutationFn: async ({ data, consentType }: ImportHoldingsParams) => {
      // Extract holdings using utility
      const holdings = extractHoldingsFromFiData(data);

      if (holdings.length === 0) {
        throw new Error("No holdings found in the imported data");
      }

      // Transform to markdown format using utility
      const formattedHoldings = transformHoldingsToMarkdownFormat(
        holdings,
        consentType,
      );

      // Create markdown table
      const markdownTable = convertToMarkdownTable(formattedHoldings);

      // Get asset type name using utility
      const assetType = getAssetTypeName(consentType);
      const messageText = `I've imported my ${assetType} holdings. Here's the data:\n\n${markdownTable}\n\nPlease analyze my portfolio and provide insights.`;

      // Create a human message
      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [{ type: "text", text: messageText }] as Message["content"],
      };

      // Get tool messages to ensure consistency
      const toolMessages = ensureToolCallsHaveResponses(stream.messages);

      // Submit to stream (will use existing thread or create new one)
      stream.submit(
        { messages: [...toolMessages, newHumanMessage] },
        {
          streamMode: ["values"],
          optimisticValues: (prev) => ({
            ...prev,
            messages: [
              ...(prev.messages ?? []),
              ...toolMessages,
              newHumanMessage,
            ],
          }),
        },
      );

      return { assetType, holdingsCount: holdings.length };
    },
    onSuccess: (result) => {
      toast.success(
        `${result.assetType} holdings added to chat (${result.holdingsCount} holdings)`,
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to import holdings", {
        description: error.message,
      });
    },
  });
}
