"use server";

import { searchSites, getReportsBySiteId } from "@/lib/services/site-service";
import { searchMapboxLocations } from "@/lib/services/mapbox-service";
import { SearchResults, Site, MapboxResult } from "@/lib/types";

/**
 * Unified Search Action
 * Executes database and Mapbox searches in parallel with robust error handling.
 * If one source fails, the other results are still returned.
 */
export async function unifiedSearchAction(
  query: string
): Promise<SearchResults> {
  if (!query || query.trim().length === 0) {
    return {
      sites: [],
      locations: [],
      combined: [],
    };
  }

  const results = await Promise.allSettled([
    searchSites(query),
    searchMapboxLocations(query),
  ]);

  const sites: Site[] =
    results[0].status === "fulfilled" ? results[0].value : [];
  const locations: MapboxResult[] =
    results[1].status === "fulfilled" ? results[1].value : [];

  // Log errors but don't fail the entire operation
  if (results[0].status === "rejected") {
    console.error("Sites search failed:", results[0].reason);
  }
  if (results[1].status === "rejected") {
    console.error("Mapbox search failed:", results[1].reason);
  }

  // Build combined results array with discriminated union
  const combined = [
    ...sites.map((site) => ({ type: "site" as const, data: site })),
    ...locations.map((location) => ({
      type: "location" as const,
      data: location,
    })),
  ];

  return {
    sites,
    locations,
    combined,
  };
}

// Legacy actions for backward compatibility (if needed elsewhere)
export async function searchSitesAction(query: string) {
  return await searchSites(query);
}

export async function searchMapboxAction(query: string) {
  return await searchMapboxLocations(query);
}

export async function getReportsAction(siteId: string) {
  return await getReportsBySiteId(siteId);
}
