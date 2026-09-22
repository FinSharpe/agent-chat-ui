"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useFiDataConsentFlow } from "@/modules/import-data/hooks/useFiData";
import FiDataAnimation from "./FiDataAnimation";

export default function FetchingFiDataModal() {
  const { fetchStatus, modalOpen, handleClose } = useFiDataConsentFlow();

  return (
    <Dialog open={modalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex min-w-[200px] flex-col items-center justify-center rounded-card border-0 bg-white p-8 text-center shadow-[0_24px_60px_rgba(10,31,77,0.28)] focus:outline-none focus-visible:ring-0 focus-visible:outline-none sm:max-w-sm dark:bg-[#0C1524]">
        <DialogTitle className="sr-only">Fetching Financial Data</DialogTitle>
        <FiDataAnimation status={fetchStatus} />
      </DialogContent>
    </Dialog>
  );
}
