import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/services/auth-service";

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return Response.json(
        { error: "Unauthorized - must be logged in to submit a report" },
        { status: 401 }
      );
    }

    // Parse request body
    const { site_id, crowd_level, content } = await request.json();

    // Validate required fields
    if (!site_id || !crowd_level) {
      return Response.json(
        { error: "Missing required fields: site_id, crowd_level" },
        { status: 400 }
      );
    }

    // Validate crowd_level is one of the allowed values
    const validLevels = ["low", "moderate", "high", "critical"];
    if (!validLevels.includes(crowd_level)) {
      return Response.json(
        { error: "Invalid crowd_level. Must be: low, moderate, high, or critical" },
        { status: 400 }
      );
    }

    // Insert report into Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          site_id,
          user_id: user.id,
          crowd_level,
          content: content || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting report:", error);
      return Response.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Report submission error:", error);
    return Response.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
