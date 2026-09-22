import { cn } from "@/lib/utils";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { FileText, X as XIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
export interface MultimodalPreviewProps {
  block: Base64ContentBlock;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function RemoveButton({
  onRemove,
  label,
  className,
}: {
  onRemove?: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0A1F4D]/70 text-white transition-colors hover:bg-[#0A1F4D]",
        className,
      )}
      onClick={onRemove}
      aria-label={label}
    >
      <XIcon className="h-3 w-3" />
    </button>
  );
}

/** An attached image or file, as a thumbnail or a file chip. */
export const MultimodalPreview: React.FC<MultimodalPreviewProps> = ({
  block,
  removable = false,
  onRemove,
  className,
  size = "md",
}) => {
  // Image block
  if (
    block.type === "image" &&
    block.source_type === "base64" &&
    typeof block.mime_type === "string" &&
    block.mime_type.startsWith("image/")
  ) {
    const url = `data:${block.mime_type};base64,${block.data}`;
    const box =
      size === "sm" ? "h-10 w-10" : size === "lg" ? "h-24 w-24" : "h-16 w-16";
    return (
      <div className={cn("relative inline-block", className)}>
        <Image
          src={url}
          alt={String(block.metadata?.name || "uploaded image")}
          className={cn(
            "rounded-nested border border-slate-100 object-cover",
            box,
          )}
          width={size === "sm" ? 16 : size === "md" ? 32 : 48}
          height={size === "sm" ? 16 : size === "md" ? 32 : 48}
        />
        {removable && (
          <RemoveButton
            onRemove={onRemove}
            label="Remove image"
            className="absolute -top-1.5 -right-1.5 z-10"
          />
        )}
      </div>
    );
  }

  // File block (PDF, CSV, Excel)
  if (block.type === "file" && block.source_type === "base64") {
    const filename =
      block.metadata?.filename || block.metadata?.name || "Uploaded file";
    return (
      <div
        className={cn(
          "glass-tile relative flex max-w-[260px] items-center gap-2.5 rounded-nested py-2 pr-2.5 pl-2",
          className,
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-tile bg-[#063BAA]/8 text-[#063BAA]",
            size === "sm" ? "h-7 w-7" : "h-9 w-9",
          )}
        >
          <FileText className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#0A1F4D]">
          {String(filename)}
        </span>
        {removable && (
          <RemoveButton
            onRemove={onRemove}
            label="Remove file"
          />
        )}
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <div
      className={cn(
        "glass-tile flex items-center gap-2 rounded-nested px-3 py-2 text-slate-500",
        className,
      )}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate text-[11px]">Unsupported file type</span>
      {removable && (
        <RemoveButton
          onRemove={onRemove}
          label="Remove file"
        />
      )}
    </div>
  );
};
