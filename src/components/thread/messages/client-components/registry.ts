"use client";
import { ComponentType } from "react";
import Sources from "./sources";
import DataGrounding from "./data-grounding";
import { ScannerResults } from "./scanner-results";
import SimulationChart from "./SimulationChart";
import LineChart from "./LineChart";
import StockAnalysisComponent from "./stock-analysis";
import MfAnalysisComponent from "./mf-analysis";
import PfAnalysisComponent from "./pf-analysis";

import ReportStatus from "./report-status";

const ClientComponentsRegistry: Record<string, ComponentType<any>> = {
  sources: Sources,
  data_grounding: DataGrounding,
  scanner_results: ScannerResults,
  simulation_chart: SimulationChart,
  line_chart: LineChart,
  stock_analysis: StockAnalysisComponent,
  mf_analysis: MfAnalysisComponent,
  pf_analysis: PfAnalysisComponent,
  report_status: ReportStatus,
};

export default ClientComponentsRegistry;
