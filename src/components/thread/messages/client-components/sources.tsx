"use client"
import React, { useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

type Source = {
    title: string
    url: string
    date?: string
    description?: string
}

type Props = {
    sources?: Source[]
}

function hostnameOf(url: string): string {
    try {
        return new URL(url).hostname
    } catch {
        return url
    }
}

export default function Sources({ sources }: Props) {
    const [isExpanded, setIsExpanded] = useState(false)

    if (!sources || sources.length === 0) return null

    const displayLimit = 5
    const hasMore = sources.length > displayLimit
    const displayedSources = isExpanded ? sources : sources.slice(0, displayLimit)

    return (
        <div className="glass-card rounded-card mt-3 w-full space-y-3 p-5">
            <div className="flex items-center justify-between">
                <span className="font-geist text-xs font-medium text-[#0A1F4D]">
                    Sources
                </span>
                <span className="rounded-full bg-[#063BAA]/8 px-2 py-0.5 text-[10px] font-medium text-[#063BAA] tabular-nums">
                    {sources.length}
                </span>
            </div>

            <div className="space-y-2">
                {displayedSources.map((source, index) => (
                    <a
                        key={`${source.url}-${index}`}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-card hover-tint rounded-nested group flex items-start gap-3 px-3.5 py-2.5 transition-colors"
                    >
                        <div className="rounded-tile flex size-8 shrink-0 items-center justify-center overflow-hidden bg-white">
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(source.url)}&sz=32`}
                                alt=""
                                className="size-5"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                }}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                                <p className="line-clamp-2 flex-1 text-[11px] font-medium text-[#0A1F4D] group-hover:text-[#063BAA]">
                                    {source.title}
                                </p>
                                <ExternalLink
                                    size={12}
                                    className="mt-0.5 shrink-0 text-slate-400 group-hover:text-[#063BAA]"
                                />
                            </div>
                            {source.description && (
                                <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                                    {source.description}
                                </p>
                            )}
                            <div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400">
                                <span className="truncate">{hostnameOf(source.url)}</span>
                                {source.date && (
                                    <>
                                        <span>·</span>
                                        <span className="shrink-0">{source.date}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {hasMore && (
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="rounded-nested hover-tint flex w-full items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-[#063BAA] transition-colors"
                >
                    <span>
                        {isExpanded ? 'Show less' : `Show ${sources.length - displayLimit} more`}
                    </span>
                    <ChevronDown
                        size={13}
                        className={cn(
                            'transition-transform',
                            isExpanded && 'rotate-180'
                        )}
                    />
                </button>
            )}
        </div>
    )
}
