import { useApiUrl } from "@/hooks/useDefaultApiValues";
import { cn } from "@/lib/utils";
import { HumanInterrupt } from "@langchain/langgraph/prebuilt";
import { ClipboardCheck } from "lucide-react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import useInterruptedActions from "../hooks/use-interrupted-actions";
import { constructOpenInStudioURL } from "../utils";
import { InboxItemInput } from "./inbox-item-input";
import { ThreadIdCopyable } from "./thread-id";

interface ThreadActionsViewProps {
  interrupt: HumanInterrupt;
  handleShowSidePanel: (showState: boolean, showDescription: boolean) => void;
  showState: boolean;
  showDescription: boolean;
}

function ButtonGroup({
  handleShowState,
  handleShowDescription,
  showingState,
  showingDescription,
}: {
  handleShowState: () => void;
  handleShowDescription: () => void;
  showingState: boolean;
  showingDescription: boolean;
}) {
  const tab = (active: boolean) =>
    cn(
      "h-8 rounded-full px-3.5 text-[11px] font-medium transition-colors",
      active
        ? "bg-[#063BAA] text-white"
        : "bg-[#063BAA]/6 text-slate-500 hover:text-[#063BAA]",
    );
  return (
    <div className="flex flex-row items-center gap-1.5">
      <button
        type="button"
        className={tab(showingState)}
        onClick={handleShowState}
      >
        State
      </button>
      <button
        type="button"
        className={tab(showingDescription)}
        onClick={handleShowDescription}
      >
        Description
      </button>
    </div>
  );
}

export function ThreadActionsView({
  interrupt,
  handleShowSidePanel,
  showDescription,
  showState,
}: ThreadActionsViewProps) {
  const [threadId] = useQueryState("threadId");
  const {
    acceptAllowed,
    hasEdited,
    hasAddedResponse,
    streaming,
    supportsMultipleMethods,
    streamFinished,
    loading,
    handleSubmit,
    handleIgnore,
    handleResolve,
    setSelectedSubmitType,
    setHasAddedResponse,
    setHasEdited,
    humanResponse,
    setHumanResponse,
    initialHumanInterruptEditValue,
  } = useInterruptedActions({
    interrupt,
  });
  const [apiUrl] = useApiUrl()

  const handleOpenInStudio = () => {
    if (!apiUrl) {
      toast.error("Error", {
        description: "Please set the LangGraph deployment URL in settings.",
        duration: 5000,
        richColors: true,
        closeButton: true,
      });
      return;
    }

    const studioUrl = constructOpenInStudioURL(apiUrl, threadId ?? undefined);
    window.open(studioUrl, "_blank");
  };

  const threadTitle = interrupt.action_request.action || "Unknown";
  const actionsDisabled = loading || streaming;
  const ignoreAllowed = interrupt.config.allow_ignore;

  return (
    <div className="flex min-h-full w-full flex-col gap-5">
      {/* Header */}
      <div className="flex w-full flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#063BAA]/8 text-[#063BAA]">
            <ClipboardCheck size={16} />
          </div>
          <div className="min-w-0">
            <span className="block text-[9px] font-medium tracking-wider text-slate-400 uppercase">
              Needs your review
            </span>
            <div className="flex items-center gap-2">
              <p className="font-geist truncate text-sm font-medium text-[#0A1F4D]">
                {threadTitle}
              </p>
              {threadId && <ThreadIdCopyable threadId={threadId} />}
            </div>
          </div>
        </div>
        <div className="flex flex-row items-center gap-1.5">
          {apiUrl && (
            <button
              type="button"
              className="glass-card hover-tint flex h-8 items-center gap-1 rounded-full px-3.5 text-[11px] font-medium text-[#0A1F4D] transition-colors"
              onClick={handleOpenInStudio}
            >
              Studio
            </button>
          )}
          <ButtonGroup
            handleShowState={() => handleShowSidePanel(true, false)}
            handleShowDescription={() => handleShowSidePanel(false, true)}
            showingState={showState}
            showingDescription={showDescription}
          />
        </div>
      </div>

      <div className="flex w-full flex-row items-center justify-start gap-2">
        <button
          type="button"
          className="glass-card hover-tint h-8 rounded-full px-3.5 text-[11px] font-medium text-[#0A1F4D] transition-colors disabled:pointer-events-none disabled:opacity-50"
          onClick={handleResolve}
          disabled={actionsDisabled}
        >
          Mark as Resolved
        </button>
        {ignoreAllowed && (
          <button
            type="button"
            className="glass-card hover-tint h-8 rounded-full px-3.5 text-[11px] font-medium text-[#0A1F4D] transition-colors disabled:pointer-events-none disabled:opacity-50"
            onClick={handleIgnore}
            disabled={actionsDisabled}
          >
            Ignore
          </button>
        )}
      </div>

      {/* Actions */}
      <InboxItemInput
        acceptAllowed={acceptAllowed}
        hasEdited={hasEdited}
        hasAddedResponse={hasAddedResponse}
        interruptValue={interrupt}
        humanResponse={humanResponse}
        initialValues={initialHumanInterruptEditValue.current}
        setHumanResponse={setHumanResponse}
        streaming={streaming}
        streamFinished={streamFinished}
        supportsMultipleMethods={supportsMultipleMethods}
        setSelectedSubmitType={setSelectedSubmitType}
        setHasAddedResponse={setHasAddedResponse}
        setHasEdited={setHasEdited}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
