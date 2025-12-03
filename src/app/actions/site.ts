"use server";

import { searchSites, getReportsBySiteId } from "@/lib/services/site-service";
import { searchMapboxLocations } from "@/lib/services/mapbox-service";

export async function searchSitesAction(query: string) {
  return await searchSites(query);
}

export async function searchMapboxAction(query: string) {
  return await searchMapboxLocations(query);
}

export async function getReportsAction(siteId: string) {
  return await getReportsBySiteId(siteId);
}
