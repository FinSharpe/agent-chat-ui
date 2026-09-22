"use client";
import { SUPPORTED_FILE_TYPES } from "@/hooks/use-file-upload";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { useQuickUploadMutation } from "../hooks/useQuickUploadMutation";
import { SectionTitle } from "./page/SectionTitle";

/**
 * Quick Upload — the reference's dashed upload card, working: choose or drop
 * statements, portfolio reports or policy documents and they go to a new chat
 * for review.
 */
export function QuickUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const upload = useQuickUploadMutation();

  const send = (list: FileList | null) => {
    if (list && list.length > 0) upload.mutate(Array.from(list));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    send(e.dataTransfer.files);
  };

  return (
    <section className="space-y-3">
      <SectionTitle>Quick Upload</SectionTitle>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`glass-card flex flex-col items-center gap-3.5 rounded-card !border-dashed p-7 text-center transition-colors ${
          dragOver
            ? "!border-[#063BAA]/50 !bg-[#063BAA]/[0.04]"
            : "!border-slate-200 dark:!border-slate-800"
        }`}
      >
        <div className="rounded-nested flex h-12 w-12 items-center justify-center bg-[#063BAA]/8 text-[#063BAA] dark:text-[#8FB4FF]">
          <Upload size={22} />
        </div>
        <div>
          <p className="text-forest-deep text-[12px] font-medium dark:text-white">
            Upload Documents
          </p>
          <p className="mx-auto mt-0.5 max-w-[260px] text-[10px] text-slate-400 dark:text-slate-500">
            Drop your bank statements, portfolio reports, or insurance documents
            here — PDF, image, CSV or Excel
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="bg-brand-gradient flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[11px] font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98 disabled:opacity-60"
        >
          {upload.isPending && (
            <Loader2
              size={12}
              className="animate-spin motion-reduce:animate-none"
            />
          )}
          {upload.isPending ? "Uploading…" : "Choose Files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={SUPPORTED_FILE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            send(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </section>
  );
}
