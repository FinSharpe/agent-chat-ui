"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth, isHydratedUser } from "@/providers/AuthProvider";
import { LogOut, Plug } from "lucide-react";
import Link from "next/link";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({ size = "default" }: { size?: "default" | "sm" }) {
  const { user, logout, isLoading } = useAuth();

  if (isLoading || !user) return null;

  const avatarSize = size === "sm" ? "size-8" : "size-9";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="focus-visible:ring-ring rounded-full focus-visible:outline-none focus-visible:ring-2"
          aria-label="User menu"
        >
          <Avatar className={avatarSize}>
            {isHydratedUser(user) && user.image && (
              <AvatarImage src={user.image} alt={user.name || ""} />
            )}
            <AvatarFallback className={`bg-[#2F6868] text-white ${textSize} font-medium`}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={size === "sm" ? "bottom" : "right"}
        align="end"
        className="w-56 p-2"
      >
        <div className="px-2 py-1.5">
          {user.name && (
            <p className="text-sm font-medium leading-none">{user.name}</p>
          )}
          {isHydratedUser(user) && user.email && (
            <p className="text-muted-foreground mt-1 text-xs">{user.email}</p>
          )}
        </div>
        <div className="my-1 h-px bg-border" />
        <PopoverClose asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            asChild
          >
            <Link href="/settings/mcp">
              <Plug className="size-4" />
              MCP Access
            </Link>
          </Button>
        </PopoverClose>
        <div className="my-1 h-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={logout}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </PopoverContent>
    </Popover>
  );
}
