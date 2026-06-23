/**
 * SIP Preview Modal - Container Component
 * Handles modal state, data fetching, and submission for SIP accounts
 */

"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useModalState from "@/hooks/useModalState";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { FiDataErrorState } from "@/modules/import-data/components/shared/FiDataErrorState";
import { SIP_COLUMNS } from "@/modules/import-data/types/sip";
import { BarChart3, Info, Loader2, Repeat } from "lucide-react";
import { useSipData } from "./hooks/useSipData";
import { useImportSipMutation } from "./hooks/useImportSipMutation";

/**
 * Modal component for SIP accounts preview
 * Allows users to review SIP registrations and import to chat
 */
export function SipPreviewModal({ consent }: BaseAnalysisModalProps) {
  const { open, handleClose, handleOpenChange } = useModalState();

  const consentID = consent?.consentID;
  const isDataReady = consent?.isDataReady;

  const importMutation = useImportSipMutation();

  // Fetch and transform SIP data
  const {
    displayData,
    isLoading,
    fiData,
    isError,
    errorKind,
    errorMessage,
  } = useSipData(consentID, !!isDataReady);

  const handleSubmit = () => {
    if (!fiData || fiData.length === 0) return;

    handleClose();

    // Call mutation to import SIPs to chat
    importMutation.mutate({ data: fiData });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          disabled={!isDataReady}
        >
          <BarChart3 className="mr-1 h-3 w-3" />
          Analyse
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] !max-w-[min(96vw,60rem)] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-green-600" />
            SIP Accounts Preview
          </DialogTitle>
          <DialogDescription>
            Review your Systematic Investment Plan registrations
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <FiDataErrorState
            assetLabel="SIP registrations"
            errorKind={errorKind}
            message={errorMessage}
            consent={consent}
            onClose={handleClose}
          />
        ) : (
          <>
        {/* Info banner */}
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            SIP registrations show your active Systematic Investment Plans
            across fund houses. This data includes account identifiers and
            registrar details fetched via the Account Aggregator framework.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">
                Loading SIP data...
              </span>
            </div>
          ) : displayData.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No SIP registrations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {SIP_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={`px-4 py-2.5 font-medium text-gray-600 ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                              ? "text-center"
                              : "text-left"
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      {SIP_COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-2.5 ${
                            col.align === "right"
                              ? "text-right"
                              : col.align === "center"
                                ? "text-center"
                                : "text-left"
                          }`}
                        >
                          {row[col.key as keyof typeof row] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              displayData.length === 0 ||
              importMutation.isPending
            }
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import to Chat"
            )}
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
