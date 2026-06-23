"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Placeholder data — the Networth card is illustrative until wired to a real
// source. Kept here with the chart so the (heavy) recharts bundle only loads
// when this component is dynamically imported.
const networthData = [
  { month: "Jan", value: 16.2 },
  { month: "Feb", value: 16.8 },
  { month: "Mar", value: 15.9 },
  { month: "Apr", value: 16.5 },
  { month: "May", value: 17.1 },
  { month: "Jun", value: 17.8 },
  { month: "Jul", value: 17.3 },
  { month: "Aug", value: 18.0 },
  { month: "Sep", value: 18.5 },
  { month: "Oct", value: 18.2 },
  { month: "Nov", value: 18.9 },
  { month: "Dec", value: 18.7 },
];

export function NetworthChart() {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={networthData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickFormatter={(value) => `₹${value}L`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`₹${value}L`, "Portfolio Value"]}
            labelStyle={{ color: "#374151" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "white" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default NetworthChart;
