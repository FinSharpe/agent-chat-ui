'use client';

import { CitationsList } from '@/components/thread/citations-list';
import { MarkdownText } from '@/components/thread/markdown-text';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ToolMessage } from '@langchain/langgraph-sdk';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react';
import type { ComponentProps } from 'react';
import { CodeBlock } from './code-block';

// Manual type definitions extracted from AI SDK
export type ToolState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
type ToolType = string

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn('rounded-md border', className)}
    {...props}
  />
);

export type ToolHeaderProps = {
  type: ToolType;
  state: ToolState;
  className?: string;
};

const getStatusBadge = (status: ToolState) => {
  const labels = {
    'input-streaming': 'Pending',
    'input-available': 'Running',
    'output-available': 'Completed',
    'output-error': 'Error',
  } as const;

  const icons = {
    'input-streaming': <CircleIcon className="size-4" />,
    'input-available': <ClockIcon className="size-4 animate-pulse" />,
    'output-available': <CheckCircleIcon className="size-4 text-green-600" />,
    'output-error': <XCircleIcon className="size-4 text-red-600" />,
  } as const;

  return (
    <Badge className="rounded-full text-xs flex gap-1" variant="secondary">
      {icons[status]}
      {labels[status]}
    </Badge>
  );
};

export const ToolHeader = ({
  className,
  type,
  state,
  ...props
}: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      'flex w-full items-center justify-between gap-4 p-3',
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <WrenchIcon className="size-4 text-muted-foreground" />
      <span className="font-medium text-sm">{type}</span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<'div'> & {
  input: unknown;
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn('space-y-2 overflow-hidden p-4', className)} {...props}>
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </h4>
    <div className="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<'div'> & {

  message?: ToolMessage;
};

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}


export const ToolOutput = ({
  className,

  message,
  ...props
}: ToolOutputProps) => {

  if (!message) {
    return null;
  }

  let parsedContent: any;
  let isJsonContent = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
      isJsonContent = isComplexValue(parsedContent);
    }
  } catch {
    // Content is not JSON, use as is
    parsedContent = message.content;
  }

  return (
    <div className={cn('space-y-2 p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {message.status === 'error' ? 'Error' : 'Result'}
      </h4>
      <div
        className={cn(
          'overflow-x-auto rounded-md text-xs [&_table]:w-full',
          message.status === 'error'
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted/50 text-foreground'
        )}
      >
        {isJsonContent ? (
          <div className="rounded-md bg-muted/50">
            <CodeBlock code={JSON.stringify(parsedContent, null, 2)} language="json" />
          </div>) : (
          <div className="px-2">
            <MarkdownText>{typeof message?.content === "string" ? message.content : ""}</MarkdownText>
            {typeof message?.content === "string" && <CitationsList content={message.content} />}
          </div>
        )}
      </div>
    </div>
  );
};
