"use client";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * The reference Import page's two row actions: a soft mint "Analyse" pill for
 * a connected account and a gradient "Connect" pill for one that isn't. The
 * modals render their own trigger, so the page's cards get these for free.
 */
export function AnalyseButton({
  className,
  children = "Analyse",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "shrink-0 rounded-full bg-[#DFF9EF] px-3 py-1.5 text-[10px] font-medium text-[#0A1F4D] transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ConnectButton({
  className,
  children = "Connect",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "bg-brand-gradient shrink-0 rounded-full px-3 py-1.5 text-[10px] font-medium text-white hover:brightness-110 disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}
