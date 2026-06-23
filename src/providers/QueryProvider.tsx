"use client";

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { useState } from 'react';

type QueryProviderProps = {
    children: React.ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(() => {
        const client = new QueryClient({
            defaultOptions: {
                queries: {
                    gcTime: 0, // Don't persist queries by default
                    staleTime: 60 * 1000, // 1 minute
                    retry: 1,
                    refetchOnWindowFocus: false,
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

    const [persister] = useState(() =>
        createAsyncStoragePersister({
            storage: {
                getItem: async (key) => await get(key),
                setItem: async (key, value) => await set(key, value),
                removeItem: async (key) => await del(key),
            },
            throttleTime: 1000, // Throttle persistence writes to once per second
        })
    );

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
