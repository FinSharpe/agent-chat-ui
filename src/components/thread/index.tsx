import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEFAULT_MODEL_TIER,
  getModelTier,
  MODEL_TIERS,
  PlannerModels,
} from "@/configs/models";
import { useFileUpload } from "@/hooks/use-file-upload";
import useDetectKeyboardOpen from "@/hooks/useDetectKeyboardOpen";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { cn } from "@/lib/utils";
import DynamicSuggestions from "@/modules/chat/components/DynamicSuggestions";
import SuggestedQueries from "@/modules/chat/components/SuggestedQueries";
import { useStreamContext } from "@/providers/Stream";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  LoaderCircle,
  Paperclip,
  Sparkles,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { v4 as uuidv4 } from "uuid";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import {
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
  useArtifactOpen,
} from "./artifact";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import McpAppToolMessage from "./messages/client-components/mcp-app";
import { HumanMessage } from "./messages/human";

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

// function OpenGitHubRepo() {
//   return (
//     <TooltipProvider>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <a
//             href="https://github.com/langchain-ai/agent-chat-ui"
//             target="_blank"
//             className="flex items-center justify-center"
//           >
//             <GitHubSVG
//               width="24"
//               height="24"
//             />
//           </a>
//         </TooltipTrigger>
//         <TooltipContent side="left">
//           <p>Open GitHub repo</p>
//         </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   );
// }

export function Thread() {
  const [artifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();
  const isMobile = useIsMobile();
  const isKeyboardOpen = useDetectKeyboardOpen();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<PlannerModels>(
    DEFAULT_MODEL_TIER.model,
  );
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    dragOver,
    handlePaste,
  } = useFileUpload();
  const [_firstTokenReceived, setFirstTokenReceived] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const nextPromptSuggestions = stream.values.next_prompt_suggestions ?? [];

  const lastError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading)
      return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...contentBlocks,
      ] as Message["content"],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], context },
      {
        streamMode: ["values"],
        config: {
          configurable: {
            model: selectedModel,
          },
        },
        optimisticValues: (prev) => ({
          ...prev,
          context,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );

    setInput("");
    setContentBlocks([]);
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
    });
  };

  const handleSuggestedQuery = (query: string) => {
    if (isLoading) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [{ type: "text", text: query }],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    stream.submit(
      { messages: [...toolMessages, newHumanMessage] },
      {
        streamMode: ["values"],
        config: {
          configurable: {
            model: selectedModel,
          },
        },
        optimisticValues: (prev) => ({
          ...prev,
          next_prompt_suggestions: [],
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );

  return (
    <div
      className={cn(
        "grid h-full w-full grid-cols-[1fr_0fr] transition-all duration-500",
        artifactOpen && !isMobile && "grid-cols-[3fr_2fr]",
      )}
    >
      <div
        className={cn(
          "relative flex min-w-0 flex-1 flex-col overflow-hidden",
          !chatStarted && "grid-rows-[1fr]",
        )}
      >
        <StickToBottom className="relative flex-1 overflow-hidden">
          <StickyToBottomContent
            className={cn(
              "scrollbar-thin absolute inset-0 overflow-y-auto",
              !chatStarted &&
                !isKeyboardOpen &&
                "flex flex-col items-stretch justify-center",
              (chatStarted || isKeyboardOpen) && "grid grid-rows-[1fr_auto]",
            )}
            contentClassName={cn(
              "chat-container mx-auto flex flex-col w-full",
              isKeyboardOpen
                ? "pb-4 justify-end"
                : chatStarted
                  ? "pt-8 pb-10"
                  : "pb-6",
            )}
            content={
              <>
                {!chatStarted && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary-main-light/10 to-brand-teal/10 blur-2xl" />
                      <Image
                        src="/logo.png"
                        alt="FinSharpeGPT"
                        width={64}
                        height={64}
                        className="relative drop-shadow-sm"
                      />
                    </div>
                    <div className="text-center">
                      <h1 className="text-2xl font-semibold tracking-tight text-primary-main-dark md:text-4xl">
                        Welcome to FinSharpeGPT
                      </h1>
                      <p className="mt-1.5 text-sm text-text-tertiary">
                        Your AI-powered finance assistant
                      </p>
                    </div>
                  </div>
                )}
                {messages
                  .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                  .map((message, index) =>
                    message.type === "human" ? (
                      <HumanMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                        isLoading={isLoading}
                      />
                    ) : message.type === "tool" ? (
                      // Render-tool results render as an inline MCP-Apps widget
                      // (no accordion, independent of hide-tool-calls); returns
                      // null for ordinary tool results, which show via the
                      // calling AIMessage's tool-call accordion instead.
                      <McpAppToolMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                      />
                    ) : (
                      <AssistantMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                        isLoading={isLoading}
                        handleRegenerate={handleRegenerate}
                      />
                    ),
                  )}
                {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
                    We need to render it outside of the messages list, since there are no messages to render */}
                {hasNoAIOrToolMessages && !!stream.interrupt && (
                  <AssistantMessage
                    key="interrupt-msg"
                    message={undefined}
                    isLoading={isLoading}
                    handleRegenerate={handleRegenerate}
                  />
                )}
                {isLoading && <AssistantMessageLoading />}
                {/* Deliberately NOT gated on !isLoading. The suggestions land
                    in a state update from the agent's after_agent hook, which
                    resolves well before the run closes — the run also carries
                    the grounding judge, which has nothing to do with these
                    chips. Gating on run completion made the user wait out the
                    judge to see them. They stay disabled until the run ends
                    (handleSuggestedQuery refuses while isLoading anyway), so
                    this only brings the render forward, and the submit path
                    clears next_prompt_suggestions optimistically, so what is
                    on screen is never the previous turn's. */}
                {nextPromptSuggestions.length > 0 &&
                  messages.length > 0 &&
                  messages[messages.length - 1].type === "ai" && (
                    <DynamicSuggestions
                      suggestions={nextPromptSuggestions}
                      onSelect={handleSuggestedQuery}
                      disabled={isLoading}
                    />
                  )}
                {stream.error && !isLoading && (
                  <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">
                      An error occurred
                    </p>
                    {typeof stream.error === "string" ? (
                      <p className="mt-1 text-sm text-red-600">
                        {stream.error}
                      </p>
                    ) : (
                      <pre className="mt-1 overflow-auto rounded bg-red-100 p-2 text-xs text-red-600">
                        {JSON.stringify(stream.error, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </>
            }
            footer={
              <div
                className={cn(
                  "sticky bottom-0 flex flex-col items-center bg-gray-50",
                  chatStarted ? "gap-8" : "gap-6",
                )}
              >
                <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                <div
                  ref={dropRef}
                  className={cn(
                    "chat-container relative z-10 mx-auto w-full transition-all duration-300",
                    isKeyboardOpen ? "mb-2" : chatStarted ? "mb-8" : "mb-3",
                  )}
                >
                  {/* Gradient border wrapper */}
                  <div
                    className={cn(
                      "rounded-2xl p-px shadow-sm transition-all duration-500",
                      isInputFocused
                        ? "bg-gradient-to-r from-primary-main-light via-brand-teal/60 to-primary-main-light input-form-glow"
                        : dragOver
                          ? "bg-gradient-to-r from-brand-teal/80 to-primary-main-light/80"
                          : "bg-border-default",
                    )}
                  >
                    <div className="rounded-[calc(1rem-1px)] bg-background">
                      <form
                        onSubmit={handleSubmit}
                        className="flex flex-col"
                      >
                        <ContentBlocksPreview
                          blocks={contentBlocks}
                          onRemove={removeBlock}
                        />
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onPaste={handlePaste}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          onClick={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            setTimeout(() => {
                              target.scrollIntoView({
                                behavior: "instant",
                                block: "center",
                              });
                            }, 300);
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !e.shiftKey &&
                              !e.metaKey &&
                              !e.nativeEvent.isComposing
                            ) {
                              e.preventDefault();
                              const el = e.target as HTMLElement | undefined;
                              const form = el?.closest("form");
                              form?.requestSubmit();
                            }
                          }}
                          placeholder="Ask anything about finance..."
                          className="field-sizing-content min-h-[44px] resize-none border-none bg-transparent p-4 pb-2 text-foreground placeholder:text-text-muted shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                        />

                        <div className="flex items-center gap-1.5 px-3 pb-3 pt-1">
                          {/* Model picker */}
                          <Popover
                            open={modelOpen}
                            onOpenChange={setModelOpen}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-all duration-200",
                                  modelOpen
                                    ? "border-primary-main-light/25 bg-primary-main-dark/8 text-primary-main-dark"
                                    : "border-border-default/60 text-text-secondary hover:border-border-default hover:bg-bg-hover hover:text-text-primary",
                                )}
                              >
                                <Sparkles className="size-3" />
                                <span>{getModelTier(selectedModel).label}</span>
                                <ChevronDown
                                  className={cn(
                                    "size-3 opacity-50 transition-transform duration-200",
                                    modelOpen && "rotate-180",
                                  )}
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              sideOffset={8}
                              className="w-48 overflow-hidden rounded-xl border-border-default bg-bg-card p-0 shadow-lg"
                            >
                              <div className="border-b border-border-default px-3 py-2">
                                <p className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                                  Model
                                </p>
                              </div>
                              <div className="py-1">
                                {MODEL_TIERS.map((tier) => {
                                  const isSelected =
                                    selectedModel === tier.model;
                                  return (
                                    <button
                                      key={tier.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedModel(tier.model);
                                        setModelOpen(false);
                                      }}
                                      className={cn(
                                        "flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors duration-150",
                                        isSelected
                                          ? "bg-primary-main-dark/5 text-primary-main-dark"
                                          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                                          isSelected
                                            ? "border-brand-teal bg-brand-teal text-white"
                                            : "border-border-default",
                                        )}
                                      >
                                        {isSelected && (
                                          <Check
                                            className="size-2.5"
                                            strokeWidth={3}
                                          />
                                        )}
                                      </span>
                                      <span className="flex flex-col">
                                        <span className="text-xs font-medium">
                                          {tier.label}
                                        </span>
                                        <span className="text-[6px] text-text-muted">
                                          {tier.description}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Attach button */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label
                                htmlFor="file-input"
                                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary"
                              >
                                <Paperclip className="size-3" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent>Attach file</TooltipContent>
                          </Tooltip>

                          <input
                            id="file-input"
                            type="file"
                            onChange={handleFileUpload}
                            multiple
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.csv,.xlsx"
                            className="hidden"
                          />

                          <div className="flex-1" />

                          {!isMobile &&
                            input.trim().length > 0 &&
                            !isLoading && (
                              <span className="select-none text-[11px] text-text-muted">
                                Enter to send
                              </span>
                            )}

                          <AnimatePresence mode="wait">
                            {stream.isLoading ? (
                              <motion.div
                                key="stop"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <Button
                                  onClick={() => stream.stop()}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5 rounded-full px-3 text-xs"
                                >
                                  <LoaderCircle className="size-3.5 animate-spin" />
                                  <span>Stop</span>
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="send"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <Button
                                  type="submit"
                                  disabled={
                                    isLoading ||
                                    (!input.trim() &&
                                      contentBlocks.length === 0)
                                  }
                                  className={cn(
                                    "h-8 w-8 rounded-full p-0 transition-all duration-200",
                                    input.trim() ||
                                      contentBlocks.length > 0
                                      ? "bg-primary-main-dark shadow-md hover:bg-primary-main-light"
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  <ArrowUp
                                    className="size-4"
                                    strokeWidth={2.5}
                                  />
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                {!chatStarted && (
                  <div className="chat-container mx-auto w-full pb-6">
                    <SuggestedQueries onQuerySelect={handleSuggestedQuery} />
                  </div>
                )}
              </div>
            }
          />
        </StickToBottom>
      </div>
      {artifactOpen && !isMobile && (
        <div className="relative flex h-full flex-col overflow-hidden border-l">
          <div className="absolute inset-0 flex min-w-[30vw] flex-col">
            <div className="grid grid-cols-[1fr_auto] border-b p-4">
              <ArtifactTitle className="truncate overflow-hidden" />
              <button
                onClick={closeArtifact}
                className="cursor-pointer"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <ArtifactContent className="relative flex-grow overflow-auto" />
          </div>
        </div>
      )}
    </div>
  );
}
