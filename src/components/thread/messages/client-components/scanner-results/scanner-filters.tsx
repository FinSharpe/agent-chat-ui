"use client";

import { Control, Controller } from 'react-hook-form';
import { useGroupOptions, useRatioOptions } from '@/hooks/use-scanner-data';
import type { Segment } from '@/types/definedge-scanner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';

export type ScannerFilterFormValues = {
    pageNumber: number;
    pageSize: number;
    segment: Segment;
    group: string;
    sortRatio: string;
    sortDirection: 'asc' | 'desc';
};

// The reference's field look: white nested surface, hairline border, navy text.
export const FIELD_CLASS =
    "h-9 rounded-nested border-slate-100 bg-white text-[11px] font-normal text-[#0A1F4D] shadow-none hover:bg-white";

type ScannerFiltersProps = {
    control: Control<ScannerFilterFormValues>;
};

export function ScannerFilters({ control }: ScannerFiltersProps) {
    const { options: groupOptions, isLoading: groupsLoading } = useGroupOptions();
    const { options: ratioOptions, isLoading: ratiosLoading } = useRatioOptions();

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {/* Segment Select */}
            <div className="space-y-1.5">
                <label className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    Exchange
                </label>
                <Controller
                    name="segment"
                    control={control}
                    render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={FIELD_CLASS}>
                                <SelectValue placeholder="Select exchange" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">NSE</SelectItem>
                                <SelectItem value="2">BSE</SelectItem>
                                <SelectItem value="-1">Both</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>

            {/* Group Combobox */}
            <div className="space-y-1.5">
                <label className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    Group
                </label>
                <Controller
                    name="group"
                    control={control}
                    render={({ field }) => (
                        <SearchableSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            options={groupOptions}
                            placeholder="Select group..."
                            searchPlaceholder="Search group..."
                            emptyText="No group found."
                            clearLabel="All Groups"
                            disabled={groupsLoading}
                            className={FIELD_CLASS}
                        />
                    )}
                />
            </div>

            {/* Sort Ratio Combobox */}
            <div className="space-y-1.5">
                <label className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    Sort By
                </label>
                <Controller
                    name="sortRatio"
                    control={control}
                    render={({ field }) => (
                        <SearchableSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            options={ratioOptions}
                            placeholder="Select ratio..."
                            searchPlaceholder="Search ratio..."
                            emptyText="No ratio found."
                            clearLabel="None"
                            disabled={ratiosLoading}
                            className={FIELD_CLASS}
                        />
                    )}
                />
            </div>

            {/* Sort Direction */}
            <div className="space-y-1.5">
                <label className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    Direction
                </label>
                <Controller
                    name="sortDirection"
                    control={control}
                    render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={FIELD_CLASS}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">Ascending</SelectItem>
                                <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
        </div>
    );
}
