"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * A wheel of `count` evenly spaced items. `rotation` is the ring's angle;
 * whichever item lands nearest 12 o'clock is active. Dragging anywhere on
 * the ring spins it, and releasing snaps to the closest item.
 */
export function useSpinWheel(count: number) {
  const step = 360 / count;
  const ringRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{
    startAngle: number;
    startRotation: number;
  } | null>(null);

  // Item at the top = the one whose (index * step + rotation) is nearest 0.
  const activeIndex = ((Math.round(-rotation / step) % count) + count) % count;

  // Angle (deg) of a pointer position relative to the ring's centre.
  const angleFromEvent = useCallback((clientX: number, clientY: number) => {
    const el = ringRef.current;
    if (!el) return 0;
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = {
      startAngle: angleFromEvent(e.clientX, e.clientY),
      startRotation: rotation,
    };
    setIsDragging(true);
    // Best-effort: throws if the pointer id is no longer active, which must
    // not abort the drag just set up.
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* capture is an optimisation, not a requirement */
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const move = (e: PointerEvent) => {
      const d = dragState.current;
      if (!d) return;
      const delta = angleFromEvent(e.clientX, e.clientY) - d.startAngle;
      setRotation(d.startRotation + delta);
    };

    // Snap to the nearest item so a mode is always cleanly centred.
    const up = () => {
      dragState.current = null;
      setIsDragging(false);
      setRotation((r) => Math.round(r / step) * step);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [isDragging, angleFromEvent, step]);

  // Tapping an item rotates it up to the top rather than selecting in place,
  // so the wheel metaphor holds however it is used.
  const rotateTo = (i: number) => {
    setRotation((r) => {
      const target = -i * step;
      // The equivalent angle nearest the current one, so the wheel takes the
      // short way round instead of unwinding several turns.
      const turns = Math.round((r - target) / 360);
      return target + turns * 360;
    });
  };

  return {
    ringRef,
    rotation,
    isDragging,
    activeIndex,
    step,
    onPointerDown,
    rotateTo,
  };
}
