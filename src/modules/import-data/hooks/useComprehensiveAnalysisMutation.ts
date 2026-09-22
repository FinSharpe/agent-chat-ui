"use client";
import { useMutation } from "@tanstack/react-query";
import { useStreamContext } from "@/providers/Stream";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import { getFiData } from "../api/aa-client";
import type { FiDataResponse } from "@/modules/import-data/types/moneyone-raw";
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

interface ConsentInfo {
  consentID: string;
  type: ConsentType;
}

interface ComprehensiveAnalysisParams {
  consents: ConsentInfo[];
}

/**
 * Mutation hook for comprehensive portfolio analysis
 * Fetches data from all connected consents and submits combined analysis to chat
 */
export function useComprehensiveAnalysisMutation() {
  const stream = useStreamContext();

  return useMutation({
    mutationFn: async ({ consents }: ComprehensiveAnalysisParams) => {
      if (consents.length === 0) {
        throw new Error("No consents selected for analysis");
      }

      // Fetch FI data for all consents, through the backend's AA endpoints.
      const dataPromises = consents.map(async (consent) => {
        try {
          const blob = await getFiData(consent.consentID, { includeRaw: true });
          return {
            type: consent.type,
            data: (blob.raw ?? []) as FiDataResponse,
          };
        } catch (error) {
          throw new Error(
            `Failed to fetch ${consent.type} data: ${
              error instanceof Error ? error.message : "unknown error"
            }`,
          );
        }
      });

      const allData = await Promise.all(dataPromises);

      // Build comprehensive message with all portfolio data
      let messageText = "I'd like a comprehensive analysis of my complete investment portfolio. Here's all my data:\n\n";

      const sections: string[] = [];

      allData.forEach(({ type, data }) => {
        const holdings = extractHoldingsFromFiData(data);

        if (holdings.length === 0) {
          return; // Skip if no holdings
        }

        const formattedHoldings = transformHoldingsToMarkdownFormat(holdings, type);
        const markdownTable = convertToMarkdownTable(formattedHoldings);
        const assetType = getAssetTypeName(type);

        sections.push(`## ${assetType}\n\n${markdownTable}`);
      });

      if (sections.length === 0) {
        throw new Error("No holdings data found across all connected accounts");
      }

      messageText += sections.join("\n\n");

      messageText += "\n\n**Analysis Request:**\n\n";
      messageText += "Please provide a comprehensive analysis covering:\n";
      messageText += "1. **Overall Portfolio Overview**: Total portfolio value, asset allocation breakdown, and diversification assessment\n";
      messageText += "2. **Performance Analysis**: Returns analysis across different asset classes and risk-adjusted performance metrics\n";
      messageText += "3. **Risk Assessment**: Portfolio risk level, concentration risks, and correlation between assets\n";
      messageText += "4. **Asset Allocation**: Current allocation vs. recommended allocation for my risk profile\n";
      messageText += "5. **Strengths & Weaknesses**: What's working well and areas that need improvement\n";
      messageText += "6. **Actionable Recommendations**: Specific, prioritized actions I should take to optimize my portfolio\n";

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

      return {
        portfolioCount: allData.length,
        totalHoldings: allData.reduce(
          (sum, { data }) => sum + extractHoldingsFromFiData(data).length,
          0,
        ),
      };
    },
    onSuccess: (result) => {
      toast.success(
        `Comprehensive analysis started (${result.portfolioCount} portfolios, ${result.totalHoldings} holdings)`,
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to run comprehensive analysis", {
        description: error.message,
      });
    },
  });
}
