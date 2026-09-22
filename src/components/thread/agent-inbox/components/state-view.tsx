import { ChevronRight, X, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  baseMessageObject,
  isArrayOfMessages,
  prettifyText,
  unknownToPrettyDate,
} from "../utils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BaseMessage } from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
import { ToolCallTable } from "./tool-call-table";
import { MarkdownText } from "../../markdown-text";

interface StateViewRecursiveProps {
  value: unknown;
  expanded?: boolean;
}

const messageTypeToLabel = (message: BaseMessage) => {
  let type = "";
  if ("type" in message) {
    type = message.type as string;
  } else {
    type = message._getType();
  }

  switch (type) {
    case "human":
      return "User";
    case "ai":
      return "Assistant";
    case "tool":
      return "Tool";
    case "System":
      return "System";
    default:
      return "";
  }
};

function MessagesRenderer({ messages }: { messages: BaseMessage[] }) {
  return (
    <div className="flex w-full flex-col gap-1">
      {messages.map((msg, idx) => {
        const messageTypeLabel = messageTypeToLabel(msg);
        const content =
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content, null);
        return (
          <div
            key={msg.id ?? `message-${idx}`}
            className="ml-2 flex w-full flex-col gap-[2px]"
          >
            <p className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">{messageTypeLabel}</p>
            {content && <MarkdownText>{content}</MarkdownText>}
            {"tool_calls" in msg && msg.tool_calls ? (
              <div className="flex w-full flex-col items-start gap-1">
                {(msg.tool_calls as ToolCall[]).map((tc, idx) => (
                  <ToolCallTable
                    key={tc.id ?? `tool-call-${idx}`}
                    toolCall={tc}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StateViewRecursive(props: StateViewRecursiveProps) {
  const date = unknownToPrettyDate(props.value);
  if (date) {
    return <p className="text-[12px] text-slate-500">{date}</p>;
  }

  if (["string", "number"].includes(typeof props.value)) {
    return <MarkdownText>{props.value as string}</MarkdownText>;
  }

  if (typeof props.value === "boolean") {
    return <MarkdownText>{JSON.stringify(props.value)}</MarkdownText>;
  }

  if (props.value == null) {
    return <p className="text-[12px] whitespace-pre-wrap text-slate-400 italic">null</p>;
  }

  if (Array.isArray(props.value)) {
    if (props.value.length > 0 && isArrayOfMessages(props.value)) {
      return <MessagesRenderer messages={props.value} />;
    }

    const valueArray = props.value as unknown[];
    return (
      <div className="flex w-full flex-row items-start justify-start gap-1">
        <span className="text-slate-400">[</span>
        {valueArray.map((item, idx) => {
          const itemRenderValue = baseMessageObject(item);
          return (
            <div
              key={`state-view-${idx}`}
              className="flex w-full flex-row items-start whitespace-pre-wrap"
            >
              <StateViewRecursive value={itemRenderValue} />
              {idx < valueArray?.length - 1 && (
                <span className="text-slate-400">,&nbsp;</span>
              )}
            </div>
          );
        })}
        <span className="text-slate-400">]</span>
      </div>
    );
  }

  if (typeof props.value === "object") {
    if (Object.keys(props.value).length === 0) {
      return <p className="text-[12px] text-slate-400">{"{}"}</p>;
    }
    return (
      <div className="relative ml-6 flex w-full flex-col items-start justify-start gap-1">
        {/* Vertical line */}
        <div className="absolute top-0 left-[-24px] h-full w-[1px] bg-slate-100" />

        {Object.entries(props.value).map(([key, value], idx) => (
          <div
            key={`state-view-object-${key}-${idx}`}
            className="relative w-full"
          >
            {/* Horizontal connector line */}
            <div className="absolute top-[10px] left-[-20px] h-[1px] w-[18px] bg-slate-100" />
            <StateViewObject
              expanded={props.expanded}
              keyName={key}
              value={value}
            />
          </div>
        ))}
      </div>
    );
  }
}

function HasContentsEllipsis({ onClick }: { onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "rounded-md p-[2px] font-mono text-[10px] leading-3",
        "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-[#063BAA]",
        "cursor-pointer transition-colors ease-in-out",
        "inline-block -translate-y-[2px]",
      )}
    >
      {"{...}"}
    </span>
  );
}

interface StateViewProps {
  keyName: string;
  value: unknown;
  /**
   * Whether or not to expand or collapse the view
   * @default true
   */
  expanded?: boolean;
}

export function StateViewObject(props: StateViewProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (props.expanded != null) {
      setExpanded(props.expanded);
    }
  }, [props.expanded]);

  return (
    <div className="relative flex flex-row items-start justify-start gap-2 text-[12px] text-[#0A1F4D]">
      <motion.div
        initial={false}
        animate={{ rotate: expanded ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          onClick={() => setExpanded((prev) => !prev)}
          className="hover-tint flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors ease-in-out hover:text-[#063BAA]"
        >
          <ChevronRight className="h-4 w-4" />
        </div>
      </motion.div>
      <div className="flex w-full flex-col items-start justify-start gap-1">
        <p className="font-medium text-[#0A1F4D]">
          {prettifyText(props.keyName)}{" "}
          {!expanded && (
            <HasContentsEllipsis onClick={() => setExpanded((prev) => !prev)} />
          )}
        </p>
        <motion.div
          initial={false}
          animate={{
            height: expanded ? "auto" : 0,
            opacity: expanded ? 1 : 0,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          style={{ overflow: "hidden" }}
          className="relative w-full"
        >
          <StateViewRecursive
            expanded={props.expanded}
            value={props.value}
          />
        </motion.div>
      </div>
    </div>
  );
}

interface StateViewComponentProps {
  values: Record<string, any>;
  description: string | undefined;
  handleShowSidePanel: (showState: boolean, showDescription: boolean) => void;
  view: "description" | "state";
}

export function StateView({
  handleShowSidePanel,
  view,
  values,
  description,
}: StateViewComponentProps) {
  const [expanded, setExpanded] = useState(false);

  if (!values) {
    return <div className="text-[12px] text-slate-400">No state found</div>;
  }

  const iconButton =
    "hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors";

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Header: which panel this is, and the controls that leave it. */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
          {view === "state" ? "Graph state" : "Description"}
        </span>
        <div className="flex items-center gap-1.5">
          {view === "state" && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className={iconButton}
              title={expanded ? "Collapse all" : "Expand all"}
            >
              {expanded ? (
                <ChevronsUpDown className="h-4 w-4" />
              ) : (
                <ChevronsDownUp className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleShowSidePanel(false, false)}
            className={iconButton}
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {view === "description" && (
        <div className="text-[13px] leading-relaxed text-[#0A1F4D]">
          <MarkdownText>
            {description ?? "No description provided"}
          </MarkdownText>
        </div>
      )}
      {view === "state" && (
        <div className="flex flex-col items-start justify-start gap-1">
          {Object.entries(values).map(([k, v], idx) => (
            <StateViewObject
              expanded={expanded}
              key={`state-view-${k}-${idx}`}
              keyName={k}
              value={v}
            />
          ))}
        </div>
      )}
    </div>
  );
}
