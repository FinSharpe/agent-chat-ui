"use client";

import React from "react";

/* The three things a Discover feature page can be instead of its content.
   They are kept apart on purpose: a failed feed, an empty one and a loading
   one are three different sentences, and collapsing any two of them tells the
   reader something untrue. */

function IconDisc({ children }: { children: React.ReactNode }) {
  return (
    <span className="tone-blue mx-auto flex h-14 w-14 items-center justify-center rounded-full">
      {children}
    </span>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="scrollbar-none flex-1 overflow-y-auto px-8 py-10">
      <div className="mx-auto max-w-[360px] space-y-4 text-center">
        {children}
      </div>
    </div>
  );
}

export const softButton =
  "rounded-full bg-[#063BAA]/8 px-4 py-2 text-[11px] font-medium text-[#063BAA] transition-colors hover-tint";

/** The feed did not answer. One sentence, and a way to ask again. */
export function RetryErrorState({
  icon,
  title,
  message,
  onRetry,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Frame>
      <IconDisc>{icon}</IconDisc>
      <h3 className="font-geist text-sm font-medium text-[#0A1F4D]">{title}</h3>
      <p className="text-[11px] leading-relaxed text-slate-500">{message}</p>
      <button
        onClick={onRetry}
        className={softButton}
      >
        Retry
      </button>
    </Frame>
  );
}

/**
 * The feed answered, and had nothing on it — a claim about the market, so it
 * is only ever made on a response that actually arrived. Nothing to retry.
 */
export function FeatureEmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Frame>
      <IconDisc>{icon}</IconDisc>
      <h3 className="font-geist text-sm font-medium text-[#0A1F4D]">{title}</h3>
      <p className="text-[11px] leading-relaxed text-slate-500">{message}</p>
      <button
        onClick={onAction}
        className={softButton}
      >
        {actionLabel}
      </button>
    </Frame>
  );
}
