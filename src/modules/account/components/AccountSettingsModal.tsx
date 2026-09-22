"use client";

// Placeholder — replaced by the port of the reference Account Settings modal.
export default function AccountSettingsModal({
  onClose,
}: {
  onClose: () => void;
  onOpenProfileSettings: () => void;
}) {
  return (
    <div className="absolute inset-0 z-[60] bg-white" onClick={onClose} />
  );
}
