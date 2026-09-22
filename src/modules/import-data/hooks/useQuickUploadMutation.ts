"use client";
import { SUPPORTED_FILE_TYPES } from "@/hooks/use-file-upload";
import { fileToContentBlock } from "@/lib/multimodal-utils";
import { useStreamContext } from "@/providers/Stream";
import type { Message } from "@langchain/langgraph-sdk";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

/**
 * Quick Upload: sends the chosen statements / reports to a new chat as file
 * attachments (the same content blocks the chat composer sends), with a
 * request to review them. The stream opens the new thread, which takes the
 * user to Chat.
 */
export function useQuickUploadMutation() {
  const stream = useStreamContext();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const valid = files.filter((f) => SUPPORTED_FILE_TYPES.includes(f.type));
      if (valid.length === 0) {
        throw new Error("Upload a PDF, image, CSV or Excel file.");
      }

      const blocks = await Promise.all(valid.map(fileToContentBlock));
      const one = valid.length === 1;
      const text = `I've uploaded ${one ? "a document" : `${valid.length} documents`} (${valid
        .map((f) => f.name)
        .join(", ")}). Please review ${one ? "it" : "them"}, summarise my holdings, balances and transactions, and point out anything I should act on.`;

      const message: Message = {
        id: uuidv4(),
        type: "human",
        content: [{ type: "text", text }, ...blocks] as Message["content"],
      };

      // A fresh conversation: the upload is its own topic, not a reply.
      stream.submit(
        { messages: [message] },
        {
          streamMode: ["values"],
          optimisticValues: (prev) => ({ ...prev, messages: [message] }),
        },
      );

      return { sent: valid.length, skipped: files.length - valid.length };
    },
    onSuccess: ({ sent, skipped }) => {
      toast.success(
        `${sent} document${sent === 1 ? "" : "s"} sent to chat for review`,
        skipped
          ? { description: `${skipped} unsupported file${skipped === 1 ? "" : "s"} skipped` }
          : undefined,
      );
    },
    onError: (error: Error) => {
      toast.error("Couldn't upload documents", { description: error.message });
    },
  });
}
