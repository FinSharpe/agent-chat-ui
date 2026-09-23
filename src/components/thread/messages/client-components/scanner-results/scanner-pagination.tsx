"use client";

import { Control, Controller } from 'react-hook-form';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FIELD_CLASS } from './scanner-filters';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ScannerFilterFormValues } from './scanner-filters';

const PAGE_BUTTON =
    "flex h-8 items-center gap-1 rounded-full bg-[#063BAA]/6 px-3 text-[11px] font-medium text-[#063BAA] transition-colors disabled:cursor-not-allowed disabled:opacity-40";

type ScannerPaginationProps = {
    control: Control<ScannerFilterFormValues>;
    currentPage: number;
    totalPages: number;
    isLoading?: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
};

export function ScannerPagination({
    control,
    currentPage,
    totalPages,
    isLoading = false,
    onPageChange,
    onPageSizeChange,
}: ScannerPaginationProps) {
    const handlePreviousPage = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <label className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    Page Size
                </label>
                <Controller
                    name="pageSize"
                    control={control}
                    render={({ field }) => (
                        <Select
                            value={String(field.value)}
                            onValueChange={(value) => {
                                const pageSize = Number(value);
                                field.onChange(pageSize);
                                onPageSizeChange(pageSize);
                            }}
                        >
                            <SelectTrigger className={`${FIELD_CLASS} w-[88px]`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1 || isLoading}
                    className={PAGE_BUTTON}
                >
                    <ChevronLeft size={14} />
                    Previous
                </button>
                <span className="text-[10px] text-slate-400 tabular-nums">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages || isLoading}
                    className={PAGE_BUTTON}
                >
                    Next
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
