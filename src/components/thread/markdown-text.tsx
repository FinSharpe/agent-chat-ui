"use client";

import "./markdown-styles.css";

import { SyntaxHighlighter } from "@/components/thread/syntax-highlighter";
import { CheckIcon, ChevronRightIcon, CopyIcon } from "lucide-react";
import { FC, memo, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CitationChip } from "@/components/thread/citations/citation-chip";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import type { CitationIndex } from "@/lib/citations";
import {
  CITATION_TAG_ATTRIBUTE,
  remarkCitations,
} from "@/lib/citations/remark-citations";
import { cn } from "@/lib/utils";

import "katex/dist/katex.min.css";

interface CodeHeaderProps {
  language?: string;
  code: string;
}

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-t-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
      <span className="lowercase [&>span]:text-xs">{language}</span>
      <TooltipIconButton
        tooltip="Copy"
        onClick={onCopy}
        className="text-white/70 hover:bg-white/10 hover:text-white"
      >
        {!isCopied && <CopyIcon />}
        {isCopied && <CheckIcon />}
      </TooltipIconButton>
    </div>
  );
};

const defaultComponents: any = {
  h1: ({ className, ...props }: { className?: string }) => (
    <h1
      className={cn(
        "mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight text-left last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: { className?: string }) => (
    <h2
      className={cn(
        "mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight text-left first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: { className?: string }) => (
    <h3
      className={cn(
        "mt-6 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight text-left first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }: { className?: string }) => (
    <h4
      className={cn(
        "mt-6 mb-4 scroll-m-20 text-xl font-semibold tracking-tight text-left first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }: { className?: string }) => (
    <h5
      className={cn(
        "my-4 text-lg font-semibold text-left first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }: { className?: string }) => (
    <h6
      className={cn("my-4 font-semibold text-left first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }: { className?: string }) => (
    <p
      className={cn("mt-5 mb-5 leading-7 text-left first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  a: ({ className, ...props }: { className?: string }) => (
    <a
      className={cn(
        "text-primary font-medium underline underline-offset-4",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }: { className?: string }) => (
    <blockquote
      className={cn("border-l-2 pl-6 italic text-left", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: { className?: string }) => (
    <ul
      className={cn("my-5 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }: { className?: string }) => (
    <ol
      className={cn("my-5 ml-6 list-decimal [&>li]:mt-2", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }: { className?: string }) => (
    <hr
      className={cn("my-5 border-b", className)}
      {...props}
    />
  ),
  table: ({ className, children, ...props }: { className?: string, children: React.ReactNode }) => (
    <div className="table-container chat-container overflow-auto">
      <table
        className={cn(
          "my-4 border-separate border-spacing-0",
          className,
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ className, ...props }: { className?: string }) => (
    <th
      className={cn(
        "bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: { className?: string }) => (
    <td
      className={cn(
        "border-b border-l px-4 py-2 text-left last:border-r",
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }: { className?: string }) => (
    <tr
      className={cn(
        "m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg",
        className,
      )}
      {...props}
    />
  ),
  sup: ({ className, ...props }: { className?: string }) => (
    <sup
      className={cn("[&>a]:text-xs [&>a]:no-underline", className)}
      {...props}
    />
  ),
  pre: ({ className, ...props }: { className?: string }) => (
    <pre
      className={cn(
        "max-w-4xl overflow-x-auto rounded-lg bg-black text-white",
        className,
      )}
      {...props}
    />
  ),
  code: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => {
    const match = /language-(\w+)/.exec(className || "");

    if (match) {
      const language = match[1];
      const code = String(children).replace(/\n$/, "");

      return (
        <>
          <CodeHeader
            language={language}
            code={code}
          />
          <SyntaxHighlighter
            language={language}
            className={className}
          >
            {code}
          </SyntaxHighlighter>
        </>
      );
    }

    return (
      <code
        className={cn("rounded font-semibold", className)}
        {...props}
      >
        {children}
      </code>
    );
  },
  button: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
    [key: string]: any;
  }) => (
    <button
      className={cn("rounded px-2 py-1", className)}
      {...props}
    >
      {children}
    </button>
  ),
  details: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => {
    return (
      <details
        className={cn(
          "rounded-lg border border-gray-200 bg-gray-50",
          className,
        )}
        {...props}
      >
        {children}
      </details>
    );
  },
  summary: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => {
    return (
      <summary
        className={cn(
          "flex cursor-pointer items-center font-medium hover:bg-gray-100",
          className,
        )}
        {...props}
      >
        <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
        {children}
      </summary>
    );
  },
  // Disable strikethrough formatting - tildes in financial data (e.g., ~1.2%, ~+2.1%)
  // can accidentally be paired as strikethrough delimiters
  del: ({ children }: { children: React.ReactNode }) => <>{children}</>,
};

/**
 * Chat typography, from the reference answer card: medium-weight navy
 * headings, relaxed 13px body, blue-dot bullets (drawn in
 * markdown-styles.css so nested and loose lists keep them) and quiet
 * hairline tables. Colour and size are inherited, so the same map serves the
 * navy answer card and the blue user bubble. PDF templates keep the defaults.
 */
const chatComponents: any = {
  ...defaultComponents,
  h1: ({ className, ...props }: { className?: string }) => (
    <h1
      className={cn("font-geist pt-1 text-base font-medium", className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }: { className?: string }) => (
    <h2
      className={cn("font-geist pt-1 text-base font-medium", className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }: { className?: string }) => (
    <h3
      className={cn("font-geist pt-1 text-sm font-medium", className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }: { className?: string }) => (
    <h4
      className={cn("font-geist pt-1 text-sm font-medium", className)}
      {...props}
    />
  ),
  h5: ({ className, ...props }: { className?: string }) => (
    <h5
      className={cn("font-geist text-[13px] font-medium", className)}
      {...props}
    />
  ),
  h6: ({ className, ...props }: { className?: string }) => (
    <h6
      className={cn("font-geist text-[13px] font-medium", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }: { className?: string }) => (
    <p
      className={cn("leading-relaxed", className)}
      {...props}
    />
  ),
  a: ({ className, ...props }: { className?: string }) => (
    <a
      className={cn(
        "font-medium text-[#063BAA] underline decoration-[#063BAA]/30 underline-offset-2 transition-colors hover:decoration-[#063BAA]",
        className,
      )}
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  blockquote: ({ className, ...props }: { className?: string }) => (
    <blockquote
      className={cn("border-l-2 border-[#063BAA]/25 pl-3.5", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: { className?: string }) => (
    <ul
      className={cn("space-y-1.5", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }: { className?: string }) => (
    <ol
      className={cn("space-y-1.5", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }: { className?: string }) => (
    <hr
      className={cn("border-slate-100", className)}
      {...props}
    />
  ),
  table: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <div className="scrollbar-thin max-h-[400px] max-w-full overflow-auto rounded-nested border border-slate-100">
      <table
        className={cn("w-full border-collapse text-[12px]", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ className, ...props }: { className?: string }) => (
    <th
      className={cn(
        "sticky top-0 bg-slate-50 px-3 py-2 text-left text-[11px] font-medium whitespace-nowrap text-slate-500",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: { className?: string }) => (
    <td
      className={cn(
        "border-t border-slate-100 px-3 py-2 text-left align-top tabular-nums",
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }: { className?: string }) => (
    <tr
      className={className}
      {...props}
    />
  ),
  pre: ({ className, ...props }: { className?: string }) => (
    <pre
      className={cn(
        "overflow-x-auto rounded-nested bg-zinc-950 text-[12px] text-white",
        className,
      )}
      {...props}
    />
  ),
  code: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => {
    if (/language-(\w+)/.test(className || "")) {
      return defaultComponents.code({ className, children, ...props });
    }
    return (
      <code
        className={cn(
          "rounded-md bg-[#063BAA]/6 px-1.5 py-0.5 text-[0.9em] font-medium",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  details: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <details
      className={cn(
        "overflow-hidden rounded-nested border border-slate-100 bg-slate-50",
        className,
      )}
      {...props}
    >
      {children}
    </details>
  ),
  summary: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <summary
      className={cn(
        "hover-tint flex cursor-pointer items-center gap-2 px-3.5 py-2.5 font-medium select-none",
        className,
      )}
      {...props}
    >
      <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
      {children}
    </summary>
  ),
};

const BASE_REMARK_PLUGINS: any[] = [
  remarkGfm,
  [remarkMath, { singleDollarTextMath: false }],
];
const CITATION_REMARK_PLUGINS: any[] = [...BASE_REMARK_PLUGINS, remarkCitations];

/**
 * Render one `[[tag]]` the citation plugin left behind.
 *
 * Only markers the resolution pass kept reach here, so an unresolvable tag is
 * not this component's problem — but a chip that leads nowhere is worse than no
 * chip, so it renders nothing rather than a dead control if one slips through.
 */
function citationSpan(citations: CitationIndex) {
  return ({ node: _node, className, children, ...props }: any) => {
    const tag = props[CITATION_TAG_ATTRIBUTE];
    // Every other span in the answer — KaTeX output, raw HTML — is left alone.
    if (typeof tag !== "string") {
      return (
        <span
          className={className}
          {...props}
        >
          {children}
        </span>
      );
    }
    const number = citations.numberOf(tag);
    const citation = citations.citationOf(tag);
    if (number == null || !citation) return null;
    return (
      <CitationChip
        number={number}
        citation={citation}
      />
    );
  };
}

const MarkdownTextImpl: FC<{
  children: string;
  /**
   * A turn's resolved citations. Supplied by the assistant message, which is
   * the only place that can see the whole turn; omitted everywhere else, where
   * the markdown pipeline stays exactly as it was.
   */
  citations?: CitationIndex;
  /**
   * `chat` draws the reference's chat typography (answer card, user bubble);
   * the default is the original look, which the PDF report templates use.
   */
  variant?: "default" | "chat";
}> = ({ children, citations, variant = "default" }) => {
  const components = useMemo(() => {
    const base = variant === "chat" ? chatComponents : defaultComponents;
    return citations && !citations.isEmpty
      ? { ...base, span: citationSpan(citations) }
      : base;
  }, [citations, variant]);

  return (
    <div
      className={
        variant === "chat"
          ? "chat-md min-w-0 text-left"
          : "markdown-content chat-container overflow-hidden text-left"
      }
    >
      <ReactMarkdown
        remarkPlugins={
          citations && !citations.isEmpty
            ? CITATION_REMARK_PLUGINS
            : BASE_REMARK_PLUGINS
        }
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const MarkdownText = memo(MarkdownTextImpl);
