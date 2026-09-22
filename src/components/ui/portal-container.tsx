"use client";

import * as React from "react";

/**
 * Where Radix overlays mount inside the app shell, so they pick up the
 * shell's theme class and type scale instead of rendering bare on <body>.
 * Outside the shell both are null and Radix falls back to <body>.
 *
 * Two roots, because the desktop shell is scaled with CSS `zoom`:
 * - Dialogs and sheets are centred with fixed insets, which zoom handles, so
 *   they mount inside the zoomed frame.
 * - Anchored overlays (popovers, selects, menus, tooltips) are placed from
 *   the anchor's on-screen rect; inside a zoomed box those offsets get
 *   scaled a second time. They mount in an unzoomed root beside the frame
 *   and zoom only their own content (`FLOATING_ZOOM`), which keeps the
 *   placement exact and the size matched to the page.
 */
export const PortalContainerContext = React.createContext<HTMLElement | null>(
  null,
);
export const FloatingPortalContainerContext =
  React.createContext<HTMLElement | null>(null);

export function usePortalContainer() {
  return React.useContext(PortalContainerContext);
}

export function useFloatingPortalContainer() {
  return React.useContext(FloatingPortalContainerContext);
}

/** Scales anchored overlay content to match the zoomed app frame. */
export const FLOATING_ZOOM = "[zoom:var(--app-zoom,1)]";
