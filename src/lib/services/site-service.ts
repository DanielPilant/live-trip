import { createClient } from "@/lib/supabase/server";
import { Site, Report } from "@/lib/types";

export async function getSites() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching sites:", error);
    return [];
  }

  return data as Site[];
}

export async function getSiteById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
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

export async function searchSites(query: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .ilike("name", `${query}%`)
    .order("name")
    .limit(10);

  if (error) {
    console.error("Error searching sites:", error);
    return [];
  }

  return data as Site[];
}
