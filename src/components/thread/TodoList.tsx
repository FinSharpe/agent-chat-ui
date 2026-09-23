import { Todo } from "@/lib/extract-todos";
import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TodoListProps {
  todos: Todo[];
  className?: string;
}

function TodoStatusIcon({ status }: { status: Todo["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-[#0A9E6E]" />;
    case "in_progress":
      return (
        <LoaderCircle className="mt-px h-3.5 w-3.5 shrink-0 animate-spin text-[#063BAA]" />
      );
    default:
      return <Circle className="mt-px h-3.5 w-3.5 shrink-0 text-slate-300" />;
  }
}

/** The agent's working plan for a question, as a quiet checklist card. */
export function TodoList({ todos, className }: TodoListProps) {
  if (!todos || todos.length === 0) {
    return null;
  }

  const done = todos.filter((t) => t.status === "completed").length;

  return (
    <div
      className={cn(
        "glass-card w-full max-w-[92%] space-y-2.5 rounded-nested px-4 py-3.5 sm:w-fit sm:min-w-[320px]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
          Tasks
        </span>
        <span className="rounded-full bg-[#063BAA]/8 px-2 py-0.5 text-[9px] font-medium text-[#063BAA] tabular-nums">
          {done}/{todos.length} done
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {todos.map((todo, index) => (
          <div
            key={index}
            className="flex items-start gap-2"
          >
            <TodoStatusIcon status={todo.status} />
            <span
              className={cn(
                "text-[12px] leading-snug",
                todo.status === "completed"
                  ? "text-slate-400"
                  : "text-[#0A1F4D]",
                todo.status === "in_progress" && "font-medium",
              )}
            >
              {todo.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
