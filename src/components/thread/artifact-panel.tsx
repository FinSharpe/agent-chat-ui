"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { ArtifactContent, ArtifactTitle, useArtifactOpen } from "./artifact";

/**
 * Where an open artifact (a cited filing, a generative-UI panel) renders.
 * Desktop: a column beside the conversation. Phone layout: a sheet over the
 * chat, like the reference's full-screen detail views.
 */
export function ArtifactPanel({ desktop }: { desktop: boolean }) {
  const [open, close] = useArtifactOpen();
  if (!open) return null;

  const body = (
    <>
      <div className="flex h-[56px] shrink-0 items-center justify-between gap-3 border-b border-slate-50 px-5">
        <ArtifactTitle className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#0A1F4D]" />
        <button
          type="button"
          onClick={close}
          className="hover-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
          title="Close"
          aria-label="Close panel"
        >
          <X size={15} />
        </button>
      </div>
      <ArtifactContent className="relative min-h-0 flex-1 overflow-auto" />
    </>
  );

  if (desktop) {
    return (
      <motion.aside
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative flex h-full w-[40%] min-w-[calc(360px*var(--wx,1))] shrink-0 flex-col overflow-hidden border-l border-slate-100 bg-white"
      >
        {body}
      </motion.aside>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute inset-0 z-50 flex flex-col bg-white"
    >
      {body}
    </motion.div>
  );
}
