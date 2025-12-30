import { createClient } from "@/lib/supabase/server";
import { Site, Report } from "@/lib/types";

export async function getSites() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_crowd_levels")
    .select("id, name, description, location, crowd_level, created_at")
    .order("name");

  if (error) {
    console.error("Error fetching sites:", error);
    return [];
  }

  return data as Site[];
}

export async function getSitesPolygons(page = 0, pageSize = 20) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("id, polygon")
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) {
    console.error("Error fetching site polygons:", error);
    return [];
  }

  return data;
}

export async function getSitesPolygonsByIds(ids: string[]) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("id, polygon")
    .in("id", ids);

  if (error) {
    console.error("Error fetching site polygons by IDs:", error);
    return [];
  }

  return data;
}

export async function getSiteById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_crowd_levels")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching site ${id}:`, error);
    return null;
  }

  return data as Site;
}

export async function getReportsBySiteId(siteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching reports for site ${siteId}:`, error);
    return [];
  }

  return data as Report[];
}

export async function getUserReportForSite(siteId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("site_id", siteId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error(`Error fetching user report for site ${siteId}:`, error);
  }

  return data as Report | null;
}
export async function searchSites(query: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("id, name, description, location, crowd_level, created_at")
    .ilike("name", `${query}%`)
    .order("name")
    .limit(10);

  if (error) {
    console.error("Error searching sites:", error);
    return [];
  }

  return data as Site[];
}
