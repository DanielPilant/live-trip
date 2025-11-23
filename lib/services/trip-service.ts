import { createClient } from "@/lib/supabase/server";
import { Trip } from "@/lib/types";

export async function getTrips() {
  const supabase = await createClient();

  // This is a placeholder query. You'll need to create the 'trips' table in Supabase.
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching trips:", error);
    return [];
  }

  return data as Trip[];
}

export async function getTripById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching trip ${id}:`, error);
    return null;
  }

  return data as Trip;
}
