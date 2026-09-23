"use client";

import { forwardRef } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TooltipIconButtonProps = ButtonProps & {
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
};

/**
 * A small round icon action with a tooltip — message copy / edit / retry and
 * similar. Ghost by default (muted icon, blue wash on hover); `secondary`
 * gives the filled mint used for a confirming action.
 */
export const TooltipIconButton = forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(
  (
    {
      children,
      tooltip,
      side = "bottom",
      className,
      variant,
      size: _size,
      asChild: _asChild,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type={type}
              {...rest}
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-full p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-full [&_svg]:shrink-0",
                variant === "secondary"
                  ? "bg-[#DFF9EF] text-[#0A1F4D]"
                  : "hover-tint text-slate-400 hover:text-[#063BAA]",
                className,
              )}
              ref={ref}
            >
              {children}
              <span className="sr-only">{tooltip}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side={side}>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

TooltipIconButton.displayName = "TooltipIconButton";
