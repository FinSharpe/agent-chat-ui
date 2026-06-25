import {
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImportMethodProps } from "../../types/import-data.types";
import { ReactNode } from "react";

export function ImportMethod({
  icon: Icon,
  title,
  description,
  status,
  lastUpdated,
  onConnect,
  onAnalyse,
  onRefresh,
  customButton,
}: ImportMethodProps & { customButton?: ReactNode }) {
  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return CheckCircle;
      case "pending":
        return AlertCircle;
      default:
        return null;
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <Card className="h-full gap-0 border border-gray-200 p-4 transition-shadow hover:shadow-md">
      <div className="flex h-full items-start gap-3">
        <div
          className={`flex-shrink-0 rounded-lg p-2 ${status === "connected" ? "bg-green-50" : "bg-gray-50"}`}
        >
          <Icon
            className={`h-6 w-6 ${status === "connected" ? "text-green-500" : "text-gray-600"}`}
          />
        </div>
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="truncate font-medium text-gray-900">{title}</h3>
            {StatusIcon && (
              <StatusIcon
                className={`h-4 w-4 ${getStatusColor()} flex-shrink-0`}
              />
            )}
          </div>
          <p className="text-sm break-words text-gray-600">{description}</p>

          {/* Last Updated Info */}
          {status === "connected" && lastUpdated && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Updated {lastUpdated}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            {/* Left side - Status and primary action */}
            <div className="flex items-center gap-2">
              {customButton ? (
                // Use custom button if provided (e.g., ImportHoldings)
                customButton
              ) : status === "available" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onConnect}
                  className="text-xs"
                >
                  Connect
                </Button>
              ) : status === "connected" ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-600">
                    Connected
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRefresh}
                    className="p-1.5 text-xs"
                    title="Refresh data"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              ) : status === "pending" ? (
                <span className="text-xs font-medium text-yellow-600">
                  Connecting...
                </span>
              ) : null}
            </div>

            {/* Right side - Always analyse button */}
            <Button
              size="sm"
              variant={status === "connected" ? "default" : "ghost"}
              onClick={onAnalyse}
              className="text-xs"
            >
              <BarChart3 className="mr-1 h-3 w-3" />
              Analyse
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
