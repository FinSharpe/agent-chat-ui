"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Home,
  Compass,
  Download,
  Brain,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAppNavigation, TabState } from "@/hooks/useAppNavigation";
import { useThreadsQuery } from "@/hooks/useThreadsQuery";
import SectionErrorState from "@/components/shared/SectionErrorState";
import { useUiStore } from "@/store/useUiStore";
import {
  ChatSummary,
  groupChats,
  TIME_GROUPS,
  useChatHistory,
} from "@/modules/history/hooks/useChatHistory";
import SidebarAccountFooter from "./SidebarAccountFooter";

const NAV_ITEMS: {
  id: TabState;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "import", label: "Import", icon: Download },
  { id: "memory", label: "Memory", icon: Brain },
];

// Desktop left rail: logo, one primary action, four nav items, then history.
// Kept deliberately quiet — no borders on rows, no helper text, search only
// appears when asked for — so the main panel carries the visual weight.
export default function WebSidebar() {
  const { activeTab, setActiveTab, createNewChat, openThread } =
    useAppNavigation();
  const [threadId] = useQueryState("threadId");
  const { chats, isLoading, renameChat, deleteChat } = useChatHistory();
  // Same query key as useChatHistory, so this is the cache entry it already
  // reads — no second request. It is only here for the failure path: a failed
  // thread search must not read as "you have no conversations" (T-10).
  const {
    isError: chatsFailed,
    isFetching: chatsRefetching,
    refetch: refetchChats,
  } = useThreadsQuery();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const onToggleCollapsed = useUiStore((s) => s.toggleSidebar);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleRenameStart = (chat: ChatSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleRenameSave = (chat: ChatSummary, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (editTitle.trim()) renameChat(chat, editTitle);
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChat(id);
    if (threadId === id) createNewChat();
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const { filtered: filteredChats, groups } = groupChats(chats, searchQuery);

  // Collapsed: a slim icon rail. Rows keep the same vertical positions as the
  // full sidebar (New chat still starts at 52px), so pages line up either way.
  if (collapsed) {
    return (
      <aside className="font-funnel flex h-full w-[calc(70px*var(--wx,1))] shrink-0 flex-col items-center border-r border-slate-100 bg-white dark:border-slate-800/50 dark:bg-[#0C1524]">
        <button
          onClick={onToggleCollapsed}
          title="Expand sidebar"
          className="group flex h-[52px] w-full shrink-0 items-center justify-center"
        >
          <span className="rounded-tile hover-tint relative flex h-10 w-10 items-center justify-center">
            <Image
              src="/logo/Finsharpe Logo - Icon.svg"
              alt="Finsharpe"
              width={24}
              height={24}
              className="h-6 w-6 transition-opacity group-hover:opacity-0"
            />
            <PanelLeftOpen
              size={20}
              className="absolute text-[#063BAA] opacity-0 transition-opacity group-hover:opacity-100"
            />
          </span>
        </button>

        <nav className="w-full shrink-0 space-y-0.5 px-2">
          <button
            onClick={() => createNewChat()}
            title="New chat"
            className="rounded-tile mb-1.5 flex h-10 w-full items-center justify-center bg-[#DFF9EF] text-[#0A1F4D] transition-colors"
          >
            <Plus
              size={20}
              strokeWidth={2.25}
            />
          </button>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`rounded-tile flex h-10 w-full items-center justify-center transition-colors ${
                  isActive
                    ? "bg-[#063BAA]/8 text-[#063BAA]"
                    : "hover-tint text-[#0A1F4D] dark:text-slate-300"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={2}
                />
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        <SidebarAccountFooter collapsed />
      </aside>
    );
  }

  return (
    <aside className="font-funnel flex h-full w-[calc(262px*var(--wx,1))] shrink-0 flex-col border-r border-slate-100 bg-white dark:border-slate-800/50 dark:bg-[#0C1524]">
      {/* Logo */}
      <div className="flex h-[52px] shrink-0 items-center justify-between pr-3 pl-4">
        <button
          className="flex items-center gap-2"
          onClick={() => setActiveTab("chat")}
        >
          <Image
            src="/logo/Finsharpe Logo - Icon.svg"
            alt="Finsharpe"
            width={24}
            height={24}
            className="h-6 w-6"
            priority
          />
          <span className="font-geist text-[14px] font-medium tracking-tight text-[#0A1F4D] dark:text-white">
            FinSharpe<span className="text-[#063BAA]">GPT</span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={onToggleCollapsed}
            className="hover-tint flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-[#063BAA]"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>
      </div>

      {/* Primary action + nav share one tight column */}
      <nav className="shrink-0 space-y-0.5 px-2">
        <button
          onClick={() => createNewChat()}
          className="rounded-tile mb-1.5 flex h-10 w-full items-center gap-2.5 bg-[#DFF9EF] px-2.5 text-left text-[#0A1F4D] transition-colors"
        >
          <Plus
            size={20}
            strokeWidth={2.25}
          />
          <span className="text-[13.5px] font-medium">New chat</span>
        </button>

        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`rounded-tile flex h-10 w-full items-center gap-2.5 px-2.5 text-left transition-colors ${
                isActive
                  ? "bg-[#063BAA]/8 text-[#063BAA]"
                  : "hover-tint text-[#0A1F4D] dark:text-slate-300"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={2}
              />
              <span className="text-[13.5px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* History header — label on the left, search toggle on the right */}
      <div className="mt-4 flex h-7 shrink-0 items-center justify-between pr-3 pl-4">
        {searchOpen ? (
          <div className="flex w-full items-center gap-1.5">
            <Search
              size={16}
              className="shrink-0 text-slate-400"
            />
            <input
              autoFocus
              type="text"
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && closeSearch()}
              className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-[#0A1F4D] placeholder-[#0A1F4D]/50 focus:outline-none dark:text-white"
            />
            <button
              onClick={closeSearch}
              className="shrink-0 text-slate-400 hover:text-[#0A1F4D] dark:hover:text-white"
              title="Close search"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <>
            <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
              Chats
            </span>
            <button
              onClick={() => setSearchOpen(true)}
              className="hover-tint -mr-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-[#063BAA]"
              title="Search chats"
            >
              <Search size={16} />
            </button>
          </>
        )}
      </div>

      {/* Chat history */}
      <div className="scrollbar-none flex-1 overflow-y-auto px-2 pb-2">
        {TIME_GROUPS.map((groupName) => {
          const groupChats = groups[groupName];
          if (groupChats.length === 0) return null;
          return (
            <div
              key={groupName}
              className="mb-2"
            >
              <h3 className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-slate-400">
                {groupName}
              </h3>
              <div className="space-y-0.5">
                {groupChats.map((chat) => {
                  const isActive = activeTab === "chat" && threadId === chat.id;
                  const isEditing = editingId === chat.id;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => !isEditing && openThread(chat.id)}
                      className={`group rounded-tile flex h-9 cursor-pointer items-center px-2.5 transition-colors ${
                        isActive
                          ? "bg-[#063BAA]/8 text-[#063BAA]"
                          : "hover-tint text-[#0A1F4D] dark:text-slate-300"
                      }`}
                    >
                      {isEditing ? (
                        <div
                          className="flex w-full items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameSave(chat, e);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[13px] text-[#0A1F4D] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleRenameSave(chat, e)}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-50 text-[#0A9E6E] hover:bg-emerald-100"
                          >
                            <Check size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="min-w-0 flex-1 truncate text-[13.5px]">
                            {chat.title}
                          </span>
                          <div className="ml-1 hidden shrink-0 items-center gap-0.5 group-hover:flex">
                            <button
                              onClick={(e) => handleRenameStart(chat, e)}
                              className="rounded p-1 text-slate-400 transition-colors hover:text-[#0A1F4D] dark:hover:text-white"
                              title="Rename"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(chat.id, e)}
                              className="rounded p-1 text-slate-400 transition-colors hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {chatsFailed ? (
          <SectionErrorState
            compact
            className="mt-2"
            label="your chats"
            onRetry={() => refetchChats()}
            retrying={chatsRefetching}
          />
        ) : (
          !isLoading &&
          filteredChats.length === 0 && (
            <div className="py-6 text-center text-[13px] text-slate-400">
              No conversations found.
            </div>
          )
        )}
      </div>

      {/* theme · identity (→ Profile) + sign out (T-02) */}
      <SidebarAccountFooter />
    </aside>
  );
}
