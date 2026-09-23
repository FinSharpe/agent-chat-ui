/**
 * Mutation hook for handing SIP registrations to chat
 */

"use client";
import { useMutation } from "@tanstack/react-query";
import { useStreamContext } from "@/providers/Stream";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { SIPFiDataResponse } from "@/modules/import-data/types/sip";
import { SIP_ANALYSIS_MESSAGE } from "@/modules/import-data/utils/chat-handoffs";

interface ImportSipParams {
  data: SIPFiDataResponse;
}

/**
 * Sends the request only: the agent fetches the registrations itself (#85).
 * The data gates the hand-off — no registrations, no turn.
 */
export function useImportSipMutation() {
  const stream = useStreamContext();

  return useMutation({
    mutationFn: async ({ data }: ImportSipParams) => {
      if (data.length === 0) {
        throw new Error("No SIP accounts found in the imported data");
      }

      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [
          { type: "text", text: SIP_ANALYSIS_MESSAGE },
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
      toast.success("SIP analysis started");
    },
    onError: (error: Error) => {
      toast.error("Failed to start SIP analysis", {
        description: error.message,
      });
    },
  });
}
