// Client-side report submission
export async function submitReport(
  siteId: string,
  crowdLevel: "low" | "moderate" | "high" | "critical",
  content?: string
) {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_id: siteId,
      crowd_level: crowdLevel,
      content: content || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit report");
  }

  return response.json();
}

export async function updateReport(
  reportId: string,
  crowdLevel: "low" | "moderate" | "high" | "critical",
  content?: string
) {
  const response = await fetch(`/api/reports/${reportId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      crowd_level: crowdLevel,
      content: content || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update report");
  }

  return response.json();
}
