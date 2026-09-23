"use client";
import { useMutation } from "@tanstack/react-query";
import { useStreamContext } from "@/providers/Stream";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import { FiDataResponse } from "@/modules/import-data/types/moneyone-raw";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { extractHoldingsFromFiData } from "../components/modals/HoldingsPreviewModal";
import {
  holdingsAnalysisMessage,
  isInvestmentClass,
} from "../utils/chat-handoffs";

interface ImportHoldingsParams {
  data: FiDataResponse;
  consentType: ConsentType;
}

/**
 * Mutation hook for handing a holdings class to chat. Sends the request only:
 * the agent fetches the holdings itself (#85). The data gates the hand-off —
 * an empty class is not worth a turn.
 */
export function useImportHoldingsMutation() {
  const stream = useStreamContext();

  return useMutation({
    mutationFn: async ({ data, consentType }: ImportHoldingsParams) => {
      if (!isInvestmentClass(consentType)) {
        throw new Error(`Unsupported consent type: ${consentType}`);
      }
      if (extractHoldingsFromFiData(data).length === 0) {
        throw new Error("No holdings found in the imported data");
      }

      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [
          { type: "text", text: holdingsAnalysisMessage(consentType) },
        ] as Message["content"],
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
    },
    onSuccess: () => {
      toast.success("Holdings analysis started");
    },
    onError: (error: Error) => {
      toast.error("Failed to start holdings analysis", {
        description: error.message,
      });
    },
  });
}
