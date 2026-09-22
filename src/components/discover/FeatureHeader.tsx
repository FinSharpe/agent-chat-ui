"use client";

import React from "react";
import { ArrowLeft, X } from "lucide-react";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { useInPopup } from "@/components/shared/Popup";

interface Props {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: React.ReactNode;
}

const circleBtn = "w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-[#0A1F4D] hover-tint transition-colors shrink-0";

// Shared header for Discover sub-features. Mobile: a 52px bar with a back
// arrow. Desktop web, as a page: starts 52px down so the back button lines up
// with the sidebar's "New chat" button. Inside a popup (a strategy, an
// algorithm…): a normal bar with the close button on the right instead.
export default function FeatureHeader({ title, subtitle, onBack, right }: Props) {
  const isDesktopWeb = useIsDesktopWeb();
  const inPopup = useInPopup();
  const pageOnDesktop = isDesktopWeb && !inPopup;

  return (
    <div className={`${pageOnDesktop ? "pt-[52px] pb-4" : "h-[52px]"} px-5 flex items-center gap-3 shrink-0 border-b border-slate-50 bg-background/60`}>
      {!inPopup && (
        <button onClick={onBack} className={circleBtn}>
          <ArrowLeft size={16} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-geist font-medium text-[#0A1F4D] truncate">{title}</h2>
        {subtitle && <p className="text-[10px] text-slate-400 truncate">{subtitle}</p>}
      </div>
      {right}
      {inPopup && (
        <button onClick={onBack} className={circleBtn} title="Close">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
