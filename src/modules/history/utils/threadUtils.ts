import { Thread } from "@langchain/langgraph-sdk";
import { format, parseISO } from "date-fns";
import { getContentString } from "@/components/thread/utils";
import { stripCitationMarkers } from "@/lib/citations";

export function getThreadInfo(thread: Thread) {
  let title = thread.thread_id;
  let preview = "No preview available";
  let messageCount = 0;
  const timestamp = thread.created_at
    ? format(parseISO(thread.created_at), "h:mm a")
    : "";

  if (
    typeof thread.values === "object" &&
    thread.values &&
    "messages" in thread.values &&
    Array.isArray(thread.values.messages) &&
    thread.values.messages.length > 0
  ) {
    const messages = thread.values.messages;
    messageCount = messages.length;
    const firstMessage = messages[0];
    title = getContentString(firstMessage.content);

    // Get preview from the last message or second message if available
    if (messages.length > 1) {
      const lastMessage = messages[messages.length - 1];
      // A preview renders outside the citation-aware markdown pipeline, so its
      // markers are stripped here — a raw tag must never reach the reader.
      preview = stripCitationMarkers(getContentString(lastMessage.content));
    } else {
      preview = title;
    }
  }

  return { title, preview, messageCount, timestamp };
}
