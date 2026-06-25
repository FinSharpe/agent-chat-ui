import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type FormModalProps = {
  title: string;
  description: string;
  icon: string;
  triggerText?: string;
  children: React.ReactNode;
};

/**
 * Reusable modal wrapper for investment forms
 * Provides consistent styling and structure across all form modals
 * Includes trigger button and dialog management
 */
export function FormModal({
  title,
  description,
  icon,
  triggerText = "Connect",
  children,
}: FormModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
        >
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] !max-w-[min(96vw,80rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{icon}</span>
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
