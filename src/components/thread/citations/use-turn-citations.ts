"use client";

import { useMemo } from "react";
import type { Message } from "@langchain/langgraph-sdk";

import {
  buildCitationNumbering,
  buildCitationRegistry,
  emptyCitationIndex,
  emptyCitationRegistry,
  resolveCitations,
  type CitationIndex,
  type CitationRegistry,
} from "@/lib/citations";
import { useStreamContext } from "@/providers/Stream";

import { getContentString } from "../utils";

/**
 * A turn's citations, as one assistant message needs to see them.
 *
 * Both the registry and the numbering are scoped to the **turn**, not to a
 * single message. The Orchestrator often emits several AI messages in one turn
 * — a paragraph, a tool round, more prose — and a marker in the second may
 * reference a passage retrieved before the first. Numbering each message
 * independently would put two different "1" chips in one answer. Numbers
 * restart on the next turn.
 */
export interface TurnCitations {
  registry: CitationRegistry;
  /** This message's text, with markers resolved to chips or stripped. */
  index: CitationIndex;
  /**
   * Whether this message is where the sources footer belongs — the last
   * answer of its turn.
   */
  isLastAnswerOfTurn: boolean;
}

/** The half-open range of `messages` covering the turn `index` belongs to. */
function turnBounds(messages: Message[], index: number): [number, number] {
  let start = index;
  while (start > 0 && messages[start - 1].type !== "human") start--;
  let end = index + 1;
  while (end < messages.length && messages[end].type !== "human") end++;
  return [start, end];
}

export function useTurnCitations(
  message: Message | undefined,
  contentString: string,
): TurnCitations {
  const thread = useStreamContext();
  const messages = thread.messages;

  return useMemo(() => {
    const position = message
      ? messages.findIndex((m) => m.id === message.id)
      : -1;
    if (position === -1) {
      return {
        registry: emptyCitationRegistry(),
        // Resolve even with no registry: an answer carrying markers the backend
        // never sent targets for must still not print them at the reader.
        index: resolveCitations(contentString, emptyCitationRegistry()),
        isLastAnswerOfTurn: false,
      };
    }

    const [start, end] = turnBounds(messages, position);
    const turn = messages.slice(start, end);
    const registry = buildCitationRegistry(turn);

    const answers = turn.filter(
      (m) => m.type === "ai" && getContentString(m.content).length > 0,
    );
    const numbering = buildCitationNumbering(
      answers.map((m) => getContentString(m.content)),
      registry,
    );

    return {
      registry,
      index: contentString
        ? resolveCitations(contentString, registry, numbering)
        : emptyCitationIndex(contentString),
      isLastAnswerOfTurn:
        answers.length > 0 && answers[answers.length - 1].id === message?.id,
    };
  }, [messages, message, contentString]);
}
