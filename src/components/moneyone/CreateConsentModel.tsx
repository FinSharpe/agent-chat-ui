"use client";
import { useCreateConsentAndRedirectMut } from "./useCreateConsentAndRedirectMut";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useImportHoldingsContext } from "./import-holdings.context";
import { ResumeConsents } from "./ResumeConsents";
import { useListConsentsMut } from "./useResumeConsents";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CreateConsentModel({ open, onClose }: Props) {
  const { consentType } = useImportHoldingsContext();
  const createConsentAndRedirectMut = useCreateConsentAndRedirectMut();
  const listMut = useListConsentsMut(consentType);
  const [mobile, setMobile] = useState("");
  const [pan, setPan] = useState("");
  const [view, setView] = useState<"form" | "resume">("form");

  const createNew = () =>
    createConsentAndRedirectMut.mutate({ number: mobile, pan });

  // One smart action: check for existing connections first. If any are found,
  // show them so the user can continue/finish/remove (or still create new).
  // If none exist, go straight to creating a new consent.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      toast.error("Enter your 10-digit mobile number");
      return;
    }
    if (pan.trim().length !== 10) {
      toast.error("Enter your 10-character PAN");
      return;
    }

    let existing;
    try {
      existing = await listMut.mutateAsync(mobile);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't check existing connections",
      );
      return;
    }

    if (existing.length > 0) {
      setView("resume");
    } else {
      createNew();
    }
  };

  // Reset back to the form whenever the modal is closed
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setView("form");
      onClose();
    }
  };

  const isChecking = listMut.isPending;
  const isCreating = createConsentAndRedirectMut.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {view === "resume" ? "Your connections" : "Connect Account"}
          </DialogTitle>
        </DialogHeader>
        <Separator />

        {view === "resume" ? (
          <ResumeConsents
            consentType={consentType}
            mobileNo={mobile}
            pan={pan}
            consents={listMut.data ?? []}
            onRefetch={() => listMut.mutate(mobile)}
            onCreateNew={createNew}
            isCreating={isCreating}
            onBack={() => setView("form")}
            onResumed={onClose}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="number">Mobile Number</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">+91</span>
                <Input
                  id="number"
                  name="number"
                  type="tel"
                  placeholder="Enter mobile number"
                  maxLength={10}
                  required
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                name="pan"
                placeholder="Enter PAN"
                maxLength={10}
                required
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isChecking || isCreating}
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking…
                </>
              ) : isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
