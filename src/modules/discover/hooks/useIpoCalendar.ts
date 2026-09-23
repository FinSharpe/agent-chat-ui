"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchIpoCalendar, fetchIpoInsight } from "../api/ipo";

/**
 * The primary-market calendar. No auto-retry, as in finsharpe-mobile: a feed
 * that failed is reported with a Retry the reader presses, because an empty
 * calendar is a claim about the market and must never be shown for a request
 * that did not answer.
 */
export function useIpoCalendar() {
  return useQuery({
    queryKey: ["ipo-calendar"],
    queryFn: ({ signal }) => fetchIpoCalendar(signal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/** One issue's analysis, addressed by Radar fincode — never by symbol. */
export function useIpoInsight(fincode: number | null) {
  return useQuery({
    queryKey: ["ipo-insight", fincode],
    queryFn: ({ signal }) => fetchIpoInsight(fincode!, signal),
    enabled: fincode !== null,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
