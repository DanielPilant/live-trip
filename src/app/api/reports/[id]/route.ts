import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/services/auth-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    
    if (!user) {
      return Response.json(
        { error: "Unauthorized - must be logged in to update a report" },
        { status: 401 }
      );
    }

    const { crowd_level, content } = await request.json();

    if (!crowd_level) {
      return Response.json(
        { error: "Missing required field: crowd_level" },
        { status: 400 }
      );
    }

    const validLevels = ["low", "moderate", "high", "critical"];
    if (!validLevels.includes(crowd_level)) {
      return Response.json(
        { error: "Invalid crowd_level. Must be: low, moderate, high, or critical" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Verify the report belongs to the user
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !report) {
      return Response.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    if (report.user_id !== user.id) {
      return Response.json(
        { error: "Unauthorized - you can only update your own reports" },
        { status: 403 }
      );
    }

    // Update the report
    const { data, error } = await supabase
      .from("reports")
      .update({
        crowd_level,
        content: content || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating report:", error);
      return Response.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Report update error:", error);
    return Response.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    
    if (!user) {
      return Response.json(
        { error: "Unauthorized - must be logged in to delete a report" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    
    // Verify the report belongs to the user
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !report) {
      return Response.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    if (report.user_id !== user.id) {
      return Response.json(
        { error: "Unauthorized - you can only delete your own reports" },
        { status: 403 }
      );
    }

    // Delete the report
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting report:", error);
      return Response.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Report deletion error:", error);
    return Response.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
