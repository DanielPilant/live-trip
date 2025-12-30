"use server";

import {
  searchSites,
  getReportsBySiteId,
  getSitesPolygons,
  getSitesPolygonsByIds,
} from "@/lib/services/site-service";
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

export async function getSitesPolygonsAction(
  page: number = 0,
  pageSize: number = 20
) {
  try {
    return await getSitesPolygons(page, pageSize);
  } catch (error) {
    console.error("Failed to fetch polygons action:", error);
    return [];
  }
}

export async function getSitesPolygonsByIdsAction(ids: string[]) {
  try {
    return await getSitesPolygonsByIds(ids);
  } catch (error) {
    console.error("Failed to fetch polygons by IDs action:", error);
    return [];
  }
}
