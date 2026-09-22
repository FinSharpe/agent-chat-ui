"use client";

import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { startCase } from 'lodash';
import { useRatioAliasMap } from '@/hooks/use-scanner-data';
import { useUiStore } from '@/store/useUiStore';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

// Quartz, recoloured to the app's navy/blue palette so the grid reads as part
// of the card around it; the dark variant follows the app theme toggle.
const GRID_BASE = {
    fontFamily: 'inherit',
    fontSize: 12,
    headerFontWeight: 500,
    wrapperBorder: false,
    wrapperBorderRadius: 0,
    spacing: 7,
} as const;

const GRID_THEME_LIGHT = themeQuartz.withParams({
    ...GRID_BASE,
    accentColor: '#063BAA',
    backgroundColor: '#FFFFFF',
    foregroundColor: '#0A1F4D',
    headerBackgroundColor: '#F5F7FB',
    headerTextColor: '#455578',
    borderColor: '#E2E8F0',
    rowHoverColor: 'rgba(6, 59, 170, 0.05)',
});

const GRID_THEME_DARK = themeQuartz.withParams({
    ...GRID_BASE,
    accentColor: '#8FB4FF',
    backgroundColor: '#0C1524',
    foregroundColor: '#F8FAFC',
    headerBackgroundColor: '#101C30',
    headerTextColor: '#C7D2E8',
    borderColor: 'rgba(6, 59, 170, 0.25)',
    rowHoverColor: 'rgba(143, 180, 255, 0.06)',
    chromeBackgroundColor: '#101C30',
});

type ScannerGridProps = {
    rowData: Record<string, any>[];
    isLoading?: boolean;
};

/**
 * Extracts the column header from a dotted key path.
 * For "Shpsummary.tpftotalpromoter.latestQuarter" returns "latestQuarter"
 * For "FdDerivedRatio.pb" returns "pb"
 */
const extractColumnName = (key: string): string => {
    const parts = key.split('.');
    return parts[parts.length - 1];
};

/**
 * Converts a camelCase string to Title Case.
 * Uses lodash startCase for conversion.
 */
const formatColumnHeader = (key: string): string => {
    const columnName = extractColumnName(key);
    return startCase(columnName);
};

export function ScannerGrid({ rowData, isLoading = false }: ScannerGridProps) {
    // Get ratio alias map for column headers
    const ratioAliasMap = useRatioAliasMap();
    const isDark = useUiStore((s) => s.themeMode === 'dark');

    // Generate column definitions from the first row of data
    const columnDefs = useMemo(() => {
        if (!rowData || rowData.length === 0) return [];

        const getColumnHeader = (key: string): string => {
            // Check if this key has a ratio alias, otherwise use formatted header
            return ratioAliasMap?.get(key) || formatColumnHeader(key);
        };

        const firstRow = rowData[0];
        return Object.keys(firstRow)
            .filter((key) => !key.toLowerCase().includes('code'))
            .map((key) => ({
                colId: key,
                headerName: getColumnHeader(key),
                valueGetter: (params: any) => params.data?.[key],
                sortable: true,
                filter: true,
                resizable: true,
                minWidth: 150,
            }));
    }, [rowData, ratioAliasMap]);

    const onGridReady = (params: any) => {
        params.api.sizeColumnsToFit();
    };

    if (isLoading) {
        return (
            <div className="glass-card rounded-card flex items-center justify-center p-12">
                <p className="text-[11px] text-slate-400">Loading...</p>
            </div>
        );
    }

    if (!rowData || rowData.length === 0) {
        return (
            <div className="glass-card rounded-card flex items-center justify-center p-12">
                <p className="text-[11px] text-slate-400">No results found</p>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-card w-full overflow-hidden">
            <div className="w-full" style={{ height: Math.min(600, 60 + rowData.length * 42) }}>
                <AgGridReact
                    theme={isDark ? GRID_THEME_DARK : GRID_THEME_LIGHT}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    onGridReady={onGridReady}
                    defaultColDef={{
                        sortable: true,
                        filter: true,
                        resizable: true,
                    }}
                    pagination={false}
                />
            </div>
        </div>
    );
}
