"use client";

import { CSVDownloadButton } from '@/components/ui/csv-download-button';
import { downloadCSV, generateCsvFilename, formatColumnHeader } from '@/lib/csv-utils';
import { useRatioAliasMap, useDownloadAllScannerResults } from '@/hooks/use-scanner-data';
import type { ScannerResultsParams } from '@/types/definedge-scanner';

type ScannerCSVDownloadButtonProps = {
    /**
     * The filename for the downloaded CSV file (without .csv extension)
     */
    filename: string;
    /**
     * Whether the button should be disabled
     */
    disabled?: boolean;
    /**
     * Scanner ID for existing scanners
     */
    scannerId?: number;
    /**
     * Query parameters for fetching scanner results
     */
    queryParams: Omit<ScannerResultsParams, 'pageNumber' | 'pageSize'>;
    /**
     * Total number of elements to fetch
     */
    totalElements: number;
};

/**
 * A CSV download button specifically for scanner results
 * Fetches all data before downloading (not just current page)
 */
export function ScannerCSVDownloadButton({
    filename,
    disabled = false,
    scannerId,
    queryParams,
    totalElements,
}: ScannerCSVDownloadButtonProps) {
    // Get ratio alias map for column headers
    const ratioAliasMap = useRatioAliasMap();

    // Mutation hook to fetch all data
    const { mutate: downloadAll, isPending } = useDownloadAllScannerResults();

    const handleDownload = () => {
        if (totalElements === 0) return;

        downloadAll(
            {
                params: queryParams,
                totalElements,
                scannerId,
            },
            {
                onSuccess: (allData) => {
                    if (allData.length === 0) {
                        console.warn('No data to download');
                        return;
                    }

                    const csvFilename = generateCsvFilename(filename);

                    // Create header formatter that uses ratio aliases
                    const headerFormatter = (key: string): string => {
                        return ratioAliasMap?.get(key) || formatColumnHeader(key);
                    };

                    downloadCSV(allData, csvFilename, headerFormatter);
                },
                onError: (error) => {
                    console.error('Error downloading CSV:', error);
                    alert('Failed to download CSV. Please try again.');
                },
            }
        );
    };

    return (
        <CSVDownloadButton
            onDownload={handleDownload}
            disabled={disabled || totalElements === 0 || isPending}
            isLoading={isPending}
            variant="ghost"
            className="h-8 gap-1.5 rounded-full bg-[#DFF9EF] px-3 text-[11px] font-medium text-[#0A1F4D] hover:bg-[#DFF9EF] hover:text-[#0A1F4D] [&_svg]:size-3.5"
        />
    );
}
