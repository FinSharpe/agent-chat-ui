"use client";
import { TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// recharts is heavy; defer it so it doesn't ship in the import-page bundle.
const NetworthChart = dynamic(
  () => import("./NetworthChart").then((m) => m.NetworthChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-full animate-pulse rounded-md bg-gray-100" />
    ),
  },
);

export function NetworthGraph() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="font-medium text-gray-900">My Networth</h3>
        </div>
        <Badge className="text-xs bg-green-50 text-green-700 border-green-200">
          +12.4% YTD
        </Badge>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-semibold text-gray-900">₹18.7L</div>
            <div className="text-sm text-gray-500">Total Portfolio Value</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium text-green-600">+₹2.1L</div>
            <div className="text-sm text-gray-500">Since last year</div>
          </div>
        </div>

        <NetworthChart />

        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-sm font-medium text-blue-600">₹12.4L</div>
            <div className="text-xs text-gray-500">Equities</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-purple-600">₹4.8L</div>
            <div className="text-xs text-gray-500">Mutual Funds</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">₹1.5L</div>
            <div className="text-xs text-gray-500">Cash & Others</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
