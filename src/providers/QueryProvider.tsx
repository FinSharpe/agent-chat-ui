"use client";

import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState } from 'react';
import { createQueryPersister } from '@/lib/query-persistence';

type QueryProviderProps = {
    children: React.ReactNode;
};

/** Status of a failed query, when the failure carried one. */
function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const e = error as { status?: unknown; response?: { status?: unknown } };
    const status = typeof e.status === 'number' ? e.status : e.response?.status;
    return typeof status === 'number' ? status : undefined;
}

/**
 * Retry twice, with backoff, when the failure could plausibly go away on its
 * own — a network error (no status at all) or a 5xx (T-10 item 2). A 4xx is
 * the server answering clearly: not found, forbidden, bad request. Retrying
 * those only delays the error state the UI needs to show, and a 401 is
 * already handled by AuthProvider's interceptor.
 */
function retryOnTransient(failureCount: number, error: unknown): boolean {
    const status = statusOf(error);
    if (status !== undefined && status < 500) return false;
    return failureCount < 2;
}

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(() => {
        const client = new QueryClient({
            defaultOptions: {
                queries: {
                    gcTime: 0, // Don't persist queries by default
                    staleTime: 60 * 1000, // 1 minute
                    retry: retryOnTransient,
                    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
                    refetchOnWindowFocus: false,
                },
                mutations: {
                    // A mutation is a write: replaying it is only safe for a
                    // request that never reached the server, so this stays at
                    // one attempt and lets each call site decide otherwise.
                    retry: false,
                },
            },
        });

        // Set specific defaults for FI data queries to ensure proper caching
        client.setQueryDefaults(['fi-data'], {
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
            staleTime: Infinity, // Never refetch automatically
            retry: false,
            refetchOnWindowFocus: false,
        });

        return client;
    });

    // IndexedDB, through the one module that can also clear it: signing out
    // and deleting the account must leave no financial data behind.
    const [persister] = useState(createQueryPersister);

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days max
                buster: '', // Empty string = no cache busting (persistent across app versions)
                // Persist specific queries by matching query key patterns
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) => {
                        const queryKey = query.queryKey;

                        // Only persist FI data queries with consent IDs: ["fi-data", consentID]
                        // Excludes the disabled placeholder: ["fi-data-disabled"]
                        //
                        // Require status === 'success' so we never dehydrate a pending
                        // (in-flight) or errored query. getAllFiData polls with 3s delays,
                        // so the throttled persister can otherwise snapshot a query while
                        // it's still pending — that pending promise gets persisted and
                        // rejects on the next page load, surfacing as
                        // "A query that was dehydrated as pending ended up rejecting".
                        return (
                            Array.isArray(queryKey) &&
                            queryKey[0] === 'fi-data' &&
                            queryKey.length > 1 &&
                            query.state.status === 'success'
                        );
                    },
                },
            }}
        >
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </PersistQueryClientProvider>
    );
}
