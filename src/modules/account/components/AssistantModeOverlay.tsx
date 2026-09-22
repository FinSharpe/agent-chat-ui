"use client";

// Placeholder — replaced by the port of the reference Assistant Mode overlay.
export default function AssistantModeOverlay({ onClose }: { onClose: () => void }) {
  return <div className="absolute inset-0 z-[60] bg-white" onClick={onClose} />;
}
