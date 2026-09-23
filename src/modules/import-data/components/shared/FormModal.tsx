"use client";
import {
  useCallback,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { AnimatePresence } from "framer-motion";
import {
  Boxes,
  Coins,
  Home,
  Landmark,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { FormModalContext } from "./form-modal-context";
import { ConnectButton, FormOverlayHeader, ImportOverlay } from "./ui";

type IconComponent = ComponentType<{ size?: number; className?: string }>;

type FormModalProps = {
  title: string;
  description: string;
  /** Header icon: a lucide icon, or the legacy emoji (mapped to its icon). */
  icon: string | IconComponent;
  triggerText?: string;
  /** Extra classes for the "Connect" trigger pill. */
  triggerClassName?: string;
  /** Optional controlled open state; uncontrolled when omitted. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

// The page used to pass emoji; the reference header shows a green lucide icon.
const EMOJI_ICONS: Record<string, IconComponent> = {
  "🏦": Landmark,
  "🛡️": ShieldCheck,
  "🏠": Home,
  "🪙": Coins,
  "🌐": Boxes,
};

function resolveIcon(
  icon: FormModalProps["icon"],
  title: string,
): IconComponent {
  if (typeof icon !== "string") return icon;
  if (EMOJI_ICONS[icon]) return EMOJI_ICONS[icon];
  if (/fixed|deposit/i.test(title)) return Landmark;
  if (/insurance/i.test(title)) return ShieldCheck;
  if (/real estate|property/i.test(title)) return Home;
  if (/commodit/i.test(title)) return Coins;
  if (/other/i.test(title)) return Boxes;
  return PlusCircle;
}

/**
 * "Add [Asset]" modal for the manual investment forms: a gradient "Connect"
 * pill that opens the reference form popup (desktop) / full-screen panel
 * (mobile) with the icon + title header. The form inside renders its own
 * scrolling fields and pinned Cancel / Submit footer.
 */
export function FormModal({
  title,
  description,
  icon,
  triggerText = "Connect",
  triggerClassName,
  open: controlledOpen,
  onOpenChange,
  children,
}: FormModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const Icon = resolveIcon(icon, title);

  return (
    <>
      <ConnectButton
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerText}
      </ConnectButton>
      <AnimatePresence>
        {open && (
          <ImportOverlay
            onClose={close}
            fit
            label={title}
          >
            <FormOverlayHeader
              icon={<Icon size={18} />}
              title={title}
              subtitle={description}
              onClose={close}
            />
            <FormModalContext.Provider value={{ close }}>
              <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            </FormModalContext.Provider>
          </ImportOverlay>
        )}
      </AnimatePresence>
    </>
  );
}
