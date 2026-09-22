"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryState } from "nuqs";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  X,
  User,
  LogOut,
  Check,
  History,
} from "lucide-react";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAuth } from "@/providers/AuthProvider";
import { useUiStore } from "@/store/useUiStore";
import {
  ChatSummary,
  groupChats,
  TIME_GROUPS,
  useChatHistory,
} from "@/modules/history/hooks/useChatHistory";

/** Mobile layout's history panel, opened from the chat toolbar. */
export default function ChatHistoryDrawer() {
  const isHistoryDrawerOpen = useUiStore((s) => s.isHistoryDrawerOpen);
  const setHistoryDrawerOpen = useUiStore((s) => s.setHistoryDrawerOpen);
  const { createNewChat, openThread } = useAppNavigation();
  const [threadId] = useQueryState("threadId");
  const { chats, isLoading, renameChat, deleteChat } = useChatHistory();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartNewChat = () => {
    createNewChat();
    setHistoryDrawerOpen(false);
  };

  const handleSelectChat = (id: string) => {
    openThread(id);
    setHistoryDrawerOpen(false);
  };

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

  const { filtered: filteredChats, groups } = groupChats(chats, searchQuery);

  return (
    <AnimatePresence>
      {isHistoryDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setHistoryDrawerOpen(false)}
            className="pointer-events-auto absolute inset-0 z-50 bg-[#0A1F4D]/30 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
            className="font-funnel pointer-events-auto absolute top-0 bottom-0 left-0 z-55 flex w-[290px] flex-col overflow-hidden border-r border-slate-100 bg-white shadow-[10px_0_30px_rgba(10,31,77,0.05)]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-50 p-4">
              <div className="flex items-center gap-2.5">
                <History
                  size={17}
                  className="text-[#063BAA]"
                  strokeWidth={1.6}
                />
                <h2 className="font-geist text-base font-medium tracking-tight text-[#0A1F4D]">
                  History
                </h2>
              </div>
              <button
                onClick={() => setHistoryDrawerOpen(false)}
                className="hover-tint flex h-8 w-8 items-center justify-center rounded-full text-[#0A1F4D] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="shrink-0 px-4 py-3">
              <button
                onClick={handleStartNewChat}
                className="bg-brand-gradient flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white shadow-md shadow-blue-900/10 transition-all hover:brightness-110 active:scale-98"
              >
                <Plus
                  size={14}
                  strokeWidth={2.5}
                />
                New Consultation
              </button>
            </div>

            {/* Search */}
            <div className="shrink-0 px-4 pb-2">
              <div className="glass-tile relative flex items-center rounded-full px-3 py-2">
                <Search
                  size={14}
                  className="mr-2 shrink-0 text-[#0A1F4D]"
                />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-none bg-transparent text-sm text-[#0A1F4D] placeholder-[#0A1F4D]/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Scrollable Chat Groups */}
            <div className="scrollbar-none flex-1 space-y-4 overflow-y-auto px-4 py-2">
              {TIME_GROUPS.map((groupName) => {
                const groupChats = groups[groupName];
                if (groupChats.length === 0) return null;

                return (
                  <div
                    key={groupName}
                    className="space-y-1"
                  >
                    <h3 className="px-2 py-1 text-xs font-medium tracking-wider text-[#0A1F4D] uppercase">
                      {groupName}
                    </h3>
                    <div className="space-y-0.5">
                      {groupChats.map((chat) => {
                        const isActive = threadId === chat.id;
                        const isEditing = editingId === chat.id;

                        return (
                          <div
                            key={chat.id}
                            onClick={() =>
                              !isEditing && handleSelectChat(chat.id)
                            }
                            className={`group rounded-tile relative flex cursor-pointer items-center justify-between px-3 py-2 transition-all ${
                              isActive
                                ? "bg-[#063BAA]/8 text-[#063BAA]"
                                : "hover-tint text-[#0A1F4D]"
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
                                    if (e.key === "Enter")
                                      handleRenameSave(chat, e);
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-sm text-[#0A1F4D] focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={(e) => handleRenameSave(chat, e)}
                                  className="flex h-6 w-6 items-center justify-center rounded bg-emerald-50 text-[#97edcc] hover:bg-emerald-100"
                                >
                                  <Check size={12} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="max-w-[170px] truncate text-sm font-medium">
                                  {chat.title}
                                </span>

                                {/* Hover Actions */}
                                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    onClick={(e) => handleRenameStart(chat, e)}
                                    className="rounded p-1 text-[#0A1F4D] transition-colors hover:bg-slate-200/50 hover:text-[#0A1F4D]"
                                  >
                                    <Edit3 size={11} />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(chat.id, e)}
                                    className="rounded p-1 text-[#0A1F4D] transition-colors hover:bg-rose-50 hover:text-rose-600"
                                  >
                                    <Trash2 size={11} />
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

              {!isLoading && filteredChats.length === 0 && (
                <div className="py-6 text-center text-sm text-[#0A1F4D]">
                  No conversations found.
                </div>
              )}
            </div>

            {/* User Profile Summary Footer */}
            <div className="shrink-0 border-t border-slate-50 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-[#063BAA]/8 text-[#063BAA]">
                    {user?.name ? (
                      <span className="text-sm font-medium">
                        {user.name[0]}
                      </span>
                    ) : (
                      <User size={14} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="max-w-[140px] truncate text-sm font-medium text-[#0A1F4D]">
                      {user?.name ?? "Account"}
                    </span>
                    <span className="text-xs text-[#0A1F4D]">
                      Connected Profile
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setHistoryDrawerOpen(false);
                    logout();
                  }}
                  className="rounded-full p-2 text-[#0A1F4D] transition-colors hover:bg-rose-50 hover:text-rose-600"
                  title="Log Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
