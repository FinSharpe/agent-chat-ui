import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useApiUrl, useAssistantId } from "@/hooks/useDefaultApiValues";
import { getApiKey } from "@/lib/api-key";
import { type Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import {
  isRemoveUIMessage,
  isUIMessage,
  uiMessageReducer,
  type RemoveUIMessage,
  type UIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { useThreads } from "./Thread";
import { PlannerModels } from "@/configs/models";

export type StateType = {
  messages: Message[];
  ui?: UIMessage[];
  next_prompt_suggestions?: string[];
};

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      context?: Record<string, unknown>;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
    ConfigurableType: {
      model: PlannerModels;
    };
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

/**
 * Whether the assistant answered its health check, and a way to ask again.
 *
 * Kept apart from the stream context because that value carries getters the
 * SDK uses to track which stream modes a consumer reads; spreading it to add a
 * field would fire them on every render.
 *
 * The thread uses this to tell a conversation that *could not load* apart from
 * one that is genuinely empty: `useStream` reports a failed history fetch
 * nowhere, so without it a saved chat renders blank while the server is down.
 */
interface ChatConnection {
  reachable: boolean;
  /** Re-runs the health check and returns the result. */
  recheck: () => Promise<boolean>;
}
const ChatConnectionContext = createContext<ChatConnection>({
  reachable: true,
  recheck: async () => true,
});
export const useChatConnection = () => useContext(ChatConnectionContext);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
}) => {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { getThreads, setThreads } = useThreads();
  const pathname = usePathname();
  const router = useRouter();

  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    // The SDK retries a failed request four times with exponential backoff,
    // which leaves an unreachable server spinning "analyzing…" for the better
    // part of a minute before anything is said. Two retries still ride out a
    // blip or a cold start, and cost the user a handful of seconds before the
    // thread tells them the truth and offers Retry.
    callerOptions: { maxRetries: 2 },
    onCustomEvent: (event, options) => {
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev) => {
          const ui = uiMessageReducer(prev.ui ?? [], event);
          return { ...prev, ui };
        });
      }
    },
    // The SDK's own error hook. Nothing user-visible happens here — the thread
    // renders the failure and the toast (see `Thread`) says it in plain words.
    // This is where the detail a developer needs survives, and the one place
    // the deployment URL may appear, because it never leaves the console.
    onError: (error) => {
      console.error(
        `[chat] run failed against ${apiUrl} (assistant ${assistantId}):`,
        error,
      );
    },
    onThreadId: (id) => {
      // If not on chat view, navigate there before setting threadId
      if (pathname !== "/") {
        router.push(`/?threadId=${id}`);
      } else {
        setThreadId(id);
      }

      // Refetch threads list when thread ID changes.
      // Wait for some seconds before fetching so we're able to get the new thread that was created.
      sleep().then(() => getThreads().then(setThreads).catch(console.error));
    },
  });

  const [reachable, setReachable] = useState(true);
  const recheck = useCallback(async () => {
    const ok = await checkGraphStatus(apiUrl, apiKey);
    setReachable(ok);
    // The deployment URL belongs here and nowhere else — the console is for
    // developers, the screen is for the investor.
    if (!ok) {
      console.error(
        `[chat] assistant unreachable at ${apiUrl} (assistant ${assistantId})`,
      );
    }
    return ok;
  }, [apiKey, apiUrl, assistantId]);

  useEffect(() => {
    recheck().then((ok) => {
      if (ok) return;
      // Written for an investor, not an operator: no deployment URL, no API
      // key, no mention of the graph.
      toast.error("Can't reach FinSharpe GPT", {
        description:
          "We couldn't connect to the assistant just now. Your chats are safe — please try again in a moment.",
        duration: 10000,
        richColors: true,
        closeButton: true,
      });
    });
  }, [recheck]);

  const connection = useMemo(
    () => ({ reachable, recheck }),
    [reachable, recheck],
  );

  return (
    <ChatConnectionContext.Provider value={connection}>
      <StreamContext.Provider value={streamValue}>
        {children}
      </StreamContext.Provider>
    </ChatConnectionContext.Provider>
  );
};

// Default values for the form
const DEFAULT_API_URL = "http://localhost:2024";
const DEFAULT_ASSISTANT_ID = "agent";

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get environment variables
  const envApiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const envAssistantId: string | undefined =
    process.env.NEXT_PUBLIC_ASSISTANT_ID;

  // Use URL params with env var fallbacks
  const [apiUrl, setApiUrl] = useApiUrl();
  const [assistantId, setAssistantId] = useAssistantId();

  // For API key, use localStorage with env var fallback
  const [apiKey, _setApiKey] = useState(() => {
    const storedKey = getApiKey() || process.env.LANGSMITH_API_KEY;
    return storedKey || "";
  });

  const setApiKey = (key: string) => {
    window.localStorage.setItem("lg:chat:apiKey", key);
    _setApiKey(key);
  };

  // Determine final values to use, prioritizing URL params then env vars
  const finalApiUrl = apiUrl || envApiUrl;
  const finalAssistantId = assistantId || envAssistantId;

  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!finalApiUrl || !finalAssistantId) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div className="animate-in fade-in-0 zoom-in-95 bg-background chat-container flex flex-col rounded-lg border shadow-lg">
          <div className="mt-14 flex flex-col gap-2 border-b p-6">
            <div className="flex flex-col items-start gap-2">
              <LangGraphLogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Agent Chat
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to Agent Chat! Before you get started, you need to enter
              the URL of the deployment and the assistant / graph ID.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();

              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const apiUrl = formData.get("apiUrl") as string;
              const assistantId = formData.get("assistantId") as string;
              const apiKey = formData.get("apiKey") as string;

              setApiUrl(apiUrl);
              setApiKey(apiKey);
              setAssistantId(assistantId);

              form.reset();
            }}
            className="bg-muted/50 flex flex-col gap-6 p-6"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiUrl">
                Deployment URL<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                This is the URL of your LangGraph deployment. Can be a local, or
                production deployment.
              </p>
              <Input
                id="apiUrl"
                name="apiUrl"
                className="bg-background"
                defaultValue={apiUrl || DEFAULT_API_URL}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="assistantId">
                Assistant / Graph ID<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                This is the ID of the graph (can be the graph name), or
                assistant to fetch threads from, and invoke when actions are
                taken.
              </p>
              <Input
                id="assistantId"
                name="assistantId"
                className="bg-background"
                defaultValue={assistantId || DEFAULT_ASSISTANT_ID}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="apiKey">LangSmith API Key</Label>
              <p className="text-muted-foreground text-sm">
                This is <strong>NOT</strong> required if using a local LangGraph
                server. This value is stored in your browser's local storage and
                is only used to authenticate requests sent to your LangGraph
                server.
              </p>
              <PasswordInput
                id="apiKey"
                name="apiKey"
                defaultValue={apiKey ?? ""}
                className="bg-background"
                placeholder="lsv2_pt_..."
              />
            </div>

            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                size="lg"
              >
                Continue
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <StreamSession
      apiKey={apiKey}
      apiUrl={apiUrl}
      assistantId={assistantId}
    >
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
