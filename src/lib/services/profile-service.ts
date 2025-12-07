import { createClient } from "@/lib/supabase/client";
import { Report } from "@/lib/types";

/**
 * ProfileService - אחראי על פעולות פרופיל וסטטיסטיקות משתמש
 */
export async function getUserReports(userId: string): Promise<Report[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user reports:", error);
      return [];
    }

    return (data as Report[]) || [];
  } catch (error) {
    console.error("Error in getUserReports:", error);
    return [];
  }
}

/**
 * קבל סטטיסטיקות למשתמש
 */
export async function getUserStatistics(reports: Report[]) {
  return {
    totalReports: reports.length,
    activeSites: new Set(reports.map((r) => r.site_id)).size,
  };
}
