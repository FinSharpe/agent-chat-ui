"use client";
import { useMutation } from "@tanstack/react-query";
import { useStreamContext } from "@/providers/Stream";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { comprehensiveAnalysisMessage } from "../utils/chat-handoffs";

interface ComprehensiveAnalysisParams {
  /** The page's account rows; only their holding counts gate the run. */
  positions: readonly { type: string; count: number }[];
}

/**
 * Mutation hook for comprehensive portfolio analysis. Sends the request only:
 * the agent fetches the book itself (#85), so nothing is read here.
 */
export function useComprehensiveAnalysisMutation() {
  const stream = useStreamContext();

  return useMutation({
    mutationFn: async ({ positions }: ComprehensiveAnalysisParams) => {
      const messageText = comprehensiveAnalysisMessage(positions);
      if (!messageText) {
        throw new Error("No holdings data found across all connected accounts");
      }

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
    },
    onSuccess: () => {
      toast.success("Comprehensive analysis started");
    },
    onError: (error: Error) => {
      toast.error("Failed to run comprehensive analysis", {
        description: error.message,
      });
    },
  });
}
