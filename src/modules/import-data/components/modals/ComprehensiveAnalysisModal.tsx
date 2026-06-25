/**
 * Comprehensive Analysis Modal - Separate Modal Component
 * Contains Dialog with trigger and manages its own state
 */

"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useModalState from "@/hooks/useModalState";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { getAllUserConsents } from "@/lib/moneyone/moneyone.storage";
import {
  Activity,
  BarChart3,
  CheckCircle,
  CreditCard,
  PieChart,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";
import { useComprehensiveAnalysisMutation } from "../../hooks/useComprehensiveAnalysisMutation";

export function ComprehensiveAnalysisModal() {
  const { open, handleClose, handleOpenChange } = useModalState();

  const comprehensiveAnalysisMutation = useComprehensiveAnalysisMutation();

  // Get all consents and filter valid ones (recompute when dialog opens)
  const allConsents = useMemo(() => {
    const consents = getAllUserConsents();
    const now = new Date();

    // Filter non-expired consents
    return consents.filter((c) => new Date(c.consentExpiry) > now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Group consents by type
  const consentsByType = useMemo(() => {
    const grouped: Record<ConsentType, (typeof allConsents)[0] | null> = {
      [ConsentType.EQUITIES]: null,
      [ConsentType.MUTUAL_FUNDS]: null,
      [ConsentType.ETF]: null,
      [ConsentType.BANK_ACCOUNTS]: null,
      [ConsentType.SIP]: null,
    };

    allConsents.forEach((consent) => {
      if (consent.type in grouped) {
        grouped[consent.type] = consent;
      }
    });

    return grouped;
  }, [allConsents]);

  // Check if we have at least one ready consent
  const hasReadyConsents = useMemo(() => {
    return Object.values(consentsByType).some((c) => c?.isDataReady);
  }, [consentsByType]);

  const handleAnalyze = () => {
    if (!hasReadyConsents) return;

    handleClose();

    // Collect all ready consents
    const readyConsents = Object.entries(consentsByType)
      .filter(([, consent]) => consent?.isDataReady)
      .map(([type, consent]) => ({
        consentID: consent!.consentID,
        type: type as ConsentType,
      }));

    // Call mutation to send comprehensive analysis to chat
    comprehensiveAnalysisMutation.mutate({ consents: readyConsents });
  };

  const getConsentIcon = (type: ConsentType) => {
    switch (type) {
      case ConsentType.EQUITIES:
        return BarChart3;
      case ConsentType.MUTUAL_FUNDS:
        return PieChart;
      case ConsentType.ETF:
        return TrendingUp;
      case ConsentType.BANK_ACCOUNTS:
        return CreditCard;
      default:
        return Activity;
    }
  };

  const getConsentLabel = (type: ConsentType) => {
    switch (type) {
      case ConsentType.EQUITIES:
        return "Equity Holdings";
      case ConsentType.MUTUAL_FUNDS:
        return "Mutual Fund Holdings";
      case ConsentType.ETF:
        return "ETF Holdings";
      case ConsentType.BANK_ACCOUNTS:
        return "Bank Accounts";
      default:
        return type;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="w-full border-0 bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 text-white hover:from-slate-950 hover:via-blue-950 hover:to-blue-800"
          type="button"
        >
          <Activity className="mr-2 h-5 w-5" />
          Run Comprehensive Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Comprehensive Portfolio Analysis
          </DialogTitle>
          <DialogDescription>
            Review your connected accounts and run a comprehensive analysis
            across all your holdings
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Connected Accounts Overview */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-900">
              Connected Accounts
            </h3>
            <div className="space-y-2">
              {Object.entries(consentsByType).map(([type, consent]) => {
                const Icon = getConsentIcon(type as ConsentType);
                const label = getConsentLabel(type as ConsentType);
                const isConnected = consent !== null;
                const isReady = consent?.isDataReady ?? false;

                return (
                  <Card
                    key={type}
                    className="p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-lg p-2 ${isReady ? "bg-blue-50" : "bg-gray-50"}`}
                        >
                          <Icon
                            className={`h-5 w-5 ${isReady ? "text-blue-600" : "text-gray-400"}`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {!isConnected && "Not connected"}
                            {isConnected &&
                              !isReady &&
                              "Connected, fetching data..."}
                            {isReady && "Ready for analysis"}
                          </p>
                        </div>
                      </div>
                      <div>
                        {isReady && (
                          <Badge className="border-green-200 bg-green-50 text-green-700">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Ready
                          </Badge>
                        )}
                        {isConnected && !isReady && (
                          <Badge className="border-yellow-200 bg-yellow-50 text-yellow-700">
                            Syncing
                          </Badge>
                        )}
                        {!isConnected && (
                          <Badge
                            variant="outline"
                            className="text-gray-500"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Not Connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Analysis Information */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-blue-900">
              What You'll Get
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  Holistic view of your entire portfolio across all connected
                  accounts
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  AI-powered insights on asset allocation and diversification
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  Personalized recommendations based on your complete financial
                  picture
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  Cross-asset correlation analysis and risk assessment
                </span>
              </li>
            </ul>
          </div>

          {!hasReadyConsents && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                Please connect at least one account and wait for the data to
                sync before running a comprehensive analysis.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="default"
            className="flex-1"
            onClick={handleClose}
          >
            Close
          </Button>
          <Button
            size="default"
            className="flex-1 bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 text-white hover:from-slate-950 hover:via-blue-950 hover:to-blue-800"
            onClick={handleAnalyze}
            disabled={
              !hasReadyConsents || comprehensiveAnalysisMutation.isPending
            }
          >
            <Activity className="mr-2 h-5 w-5" />
            {comprehensiveAnalysisMutation.isPending
              ? "Analyzing..."
              : "Run Comprehensive Analysis"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
