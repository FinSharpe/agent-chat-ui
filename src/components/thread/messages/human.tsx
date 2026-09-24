import { MarkdownText } from "@/components/thread/markdown-text";
import { MultimodalPreview } from "@/components/thread/MultimodalPreview";
import { TodoList } from "@/components/thread/TodoList";
import { getTodosForMessage } from "@/lib/extract-todos";
import { isBase64ContentBlock } from "@/lib/multimodal-utils";
import { useModelGate } from "@/modules/chat/hooks/useChatModels";
import { runConfigurable } from "@/modules/chat/store/useChatPrefsStore";
import { useStreamContext } from "@/providers/Stream";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { Message } from "@langchain/langgraph-sdk";
import { ChevronDown } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";

function EditableContent({
  value,
  setValue,
  onSubmit,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <textarea
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      aria-label="Edit message"
      className="glass-card rounded-nested field-sizing-content min-h-[76px] w-full resize-none rounded-tr-xs p-3.5 text-[13px] leading-relaxed text-[#0A1F4D] focus:border-[#063BAA]/40 focus:outline-none"
    />
  );
}

// A long user message shows its first ~7 lines under a fade, with a toggle
// to read the rest. Messages that would hide only a line or two stay whole.
const COLLAPSED_HEIGHT = 160; // ~7 lines of 13px text at leading-relaxed
const COLLAPSE_AT = 240; // ~11 lines

function CollapsibleText({ children }: { children: React.ReactNode }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const [fullHeight, setFullHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const id = useId();

  // Measure the unclipped text, and again whenever it reflows (a narrower
  // window, a font load).
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => setFullHeight(body.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, []);

  const collapsible = fullHeight > COLLAPSE_AT;
  const clipped = collapsible && !expanded;

  const toggle = () => {
    setExpanded((was) => !was);
    // Collapsing a message read to its end would leave the reader below
    // it; bring its top back into view.
    if (expanded) {
      requestAnimationFrame(() =>
        clipRef.current?.scrollIntoView({ block: "nearest" }),
      );
    }
  };

  return (
    <>
      <div
        ref={clipRef}
        id={id}
        style={
          collapsible
            ? { maxHeight: expanded ? fullHeight : COLLAPSED_HEIGHT }
            : undefined
        }
        className={
          collapsible
            ? `overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none ${
                clipped
                  ? "[mask-image:linear-gradient(to_bottom,#000_55%,transparent)]"
                  : ""
              }`
            : undefined
        }
      >
        <div ref={bodyRef}>{children}</div>
      </div>
      {collapsible && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls={id}
          className="mt-1.5 -mb-1 ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold opacity-80 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current/30 focus-visible:outline-none"
        >
          {expanded ? "Show less" : "Show more"}
          <ChevronDown
            aria-hidden
            className={`size-3.5 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </>
  );
}

/**
 * The user's turn: attachments, then a blue bubble (the reference's user
 * message), with copy / edit / version controls under it on hover. A long
 * message collapses to its opening lines behind a Show more toggle.
 */
export function HumanMessage({
  message,
  isLoading,
}: {
  message: Message;
  isLoading: boolean;
}) {
  const thread = useStreamContext();
  const gate = useModelGate();
  const meta = thread.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const contentString = getContentString(message.content);

  // Extract todos associated with this human message
  const todos = message.id
    ? getTodosForMessage(thread.messages, message.id)
    : undefined;

  // An edited question runs on the model picked now, like a new one — and,
  // like a new one, waits for the user to choose when that pin cannot run
  // (finsharpe-agents#255). The editor stays open until it goes out.
  const handleSubmitEdit = () =>
    gate((model) => {
      setIsEditing(false);

      const newMessage: Message = { type: "human", content: value };
      thread.submit(
        { messages: [newMessage] },
        {
          checkpoint: parentCheckpoint,
          streamMode: ["values"],
          config: { configurable: runConfigurable(model) },
          optimisticValues: (prev) => {
            const values = meta?.firstSeenState?.values;
            if (!values) return prev;

            return {
              ...values,
              messages: [...(values.messages ?? []), newMessage],
            };
          },
        },
      );
    });

  const attachments = Array.isArray(message.content)
    ? (message.content.filter((block) =>
        isBase64ContentBlock(block),
      ) as unknown as Base64ContentBlock[])
    : [];

  const actions = (
    <>
      <BranchSwitcher
        branch={meta?.branch}
        branchOptions={meta?.branchOptions}
        onSelect={(branch) => thread.setBranch(branch)}
        isLoading={isLoading}
      />
      <CommandBar
        isLoading={isLoading}
        content={contentString}
        isEditing={isEditing}
        setIsEditing={(c) => {
          if (c) {
            setValue(contentString);
          }
          setIsEditing(c);
        }}
        handleSubmitEdit={handleSubmitEdit}
        isHumanMessage={true}
      />
    </>
  );

  return (
    <div className="animate-fade-in flex w-full flex-col gap-2">
      <div className="flex w-full flex-col items-end gap-1">
        {isEditing ? (
          <div className="flex w-full max-w-[85%] flex-col items-end gap-1.5">
            <EditableContent
              value={value}
              setValue={setValue}
              onSubmit={handleSubmitEdit}
            />
            <div className="flex items-center gap-1">{actions}</div>
          </div>
        ) : (
          <>
            {attachments.length > 0 && (
              <div className="flex max-w-[85%] flex-wrap items-end justify-end gap-2">
                {attachments.map((block, idx) => (
                  <MultimodalPreview
                    key={idx}
                    block={block}
                    size="md"
                  />
                ))}
              </div>
            )}
            {contentString ? (
              // Copy / edit / versions float on the bubble's top edge on
              // hover; touch screens show them under the text once the
              // bubble is tapped — chat.css.
              <div
                tabIndex={-1}
                className="chat-msg rounded-nested relative flex max-w-[85%] flex-col rounded-tr-xs bg-[#063BAA]/8 p-3.5 text-[13px] leading-relaxed font-medium text-[#063BAA] outline-none"
              >
                <CollapsibleText>
                  <MarkdownText variant="chat">{contentString}</MarkdownText>
                </CollapsibleText>
                <div className="chat-msg-actions chat-msg-actions--start">
                  {actions}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 opacity-60 transition-opacity hover:opacity-100">
                {actions}
              </div>
            )}
          </>
        )}
      </div>

      {/* The agent's plan for this question, under it, left-aligned. */}
      {todos && todos.length > 0 && !isEditing && <TodoList todos={todos} />}
    </div>
  );
}
