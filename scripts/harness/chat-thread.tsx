/**
 * The real chat transcript (`MessageList`, and through it `AssistantMessage`,
 * `HumanMessage` and the run's error state) rendered to static markup over a
 * stream the check describes — the messages the runtime's `values` event would
 * carry and the error `useStream` would hold — inside the providers the chat
 * page has. Nothing is fetched: effects do not run in a static render, and the
 * Balance a component would read is seeded in the query cache.
 *
 * Not a check itself: `scripts/run-checks.mjs` only runs files under a suite.
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Message } from "@langchain/langgraph-sdk";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";

import { ArtifactProvider } from "@/components/thread/artifact";
import { MessageList } from "@/components/thread/message-list";
import { creditKeys } from "@/modules/credits/hooks/useCredits";
import { AuthProvider } from "@/providers/AuthProvider";
import StreamContext from "@/providers/Stream";

export interface ThreadFixture {
  messages: Message[];
  /** What `useStream` holds as the run's error. */
  error?: unknown;
  isLoading?: boolean;
  /** The chat could not be loaded at all. */
  loadFailed?: boolean;
  /** A Balance already read, in hundredths. A static render has nobody
   *  signed in, so it is seeded under the anonymous key. */
  balanceMinor?: number;
}

const router = {
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
} as unknown as AppRouterInstance;

type StreamValue = NonNullable<React.ContextType<typeof StreamContext>>;

/** The thread as the chat page draws it. */
export function renderThread(fixture: ThreadFixture): string {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (fixture.balanceMinor !== undefined) {
    client.setQueryData(creditKeys.balance(""), {
      balance_minor: fixture.balanceMinor,
      gated: fixture.balanceMinor <= 0,
    });
  }
  const stream = {
    messages: fixture.messages,
    isLoading: fixture.isLoading ?? false,
    values: { messages: fixture.messages, ui: [] },
    error: fixture.error,
    interrupt: undefined,
    getMessagesMetadata: () => undefined,
    setBranch: () => {},
    submit: () => {},
    stop: () => {},
  } as unknown as StreamValue;

  return renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <NuqsTestingAdapter>
        <AuthProvider>
          <QueryClientProvider client={client}>
            <StreamContext.Provider value={stream}>
              <ArtifactProvider>
                <MessageList
                  onSuggestion={() => {}}
                  onRegenerate={() => {}}
                  onRetry={() => {}}
                  loadFailed={fixture.loadFailed}
                />
              </ArtifactProvider>
            </StreamContext.Provider>
          </QueryClientProvider>
        </AuthProvider>
      </NuqsTestingAdapter>
    </AppRouterContext.Provider>,
  );
}

/** The text a reader sees: markup without tags, entities decoded. */
export function textOf(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** One element of rendered markup: its tag, its attributes as written, and
 *  where its opening tag starts. */
export interface MarkupElement {
  tag: string;
  attrs: string;
  start: number;
  children: MarkupElement[];
  parent: MarkupElement | null;
}

const VOID = new Set([
  "area",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

/** A small tree of the markup React rendered, enough to ask where an element
 *  sits: which element holds it and what comes before it. */
export function parseMarkup(markup: string): MarkupElement {
  const root: MarkupElement = {
    tag: "#root",
    attrs: "",
    start: 0,
    children: [],
    parent: null,
  };
  let open = root;
  const TAG = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
  for (const match of markup.matchAll(TAG)) {
    const [, closing, tag, attrs, selfClosing] = match;
    if (closing) {
      let node: MarkupElement | null = open;
      while (node && node.tag !== tag) node = node.parent;
      if (node?.parent) open = node.parent;
      continue;
    }
    const element: MarkupElement = {
      tag,
      attrs,
      start: match.index ?? 0,
      children: [],
      parent: open,
    };
    open.children.push(element);
    if (!selfClosing && !VOID.has(tag.toLowerCase())) open = element;
  }
  return root;
}

/** Every element whose attributes match `pattern`, in document order. */
export function findAll(root: MarkupElement, pattern: RegExp): MarkupElement[] {
  const found: MarkupElement[] = [];
  const walk = (node: MarkupElement) => {
    if (pattern.test(node.attrs)) found.push(node);
    node.children.forEach(walk);
  };
  walk(root);
  return found;
}

/** The elements holding `node`, nearest first. */
export function ancestorsOf(node: MarkupElement): MarkupElement[] {
  const chain: MarkupElement[] = [];
  for (let p = node.parent; p && p.tag !== "#root"; p = p.parent) chain.push(p);
  return chain;
}

export const human = (id: string, text: string) =>
  ({ type: "human", id, content: text }) as unknown as Message;

export const ai = (
  id: string,
  text: string,
  additional_kwargs: Record<string, unknown> = {},
) =>
  ({ type: "ai", id, content: text, additional_kwargs }) as unknown as Message;
