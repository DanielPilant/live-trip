"use client";

import { useState, useEffect } from "react";
import { submitReport, updateReport } from "@/lib/services/report-service";
import { CrowdLevel, Report } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface ReportFormProps {
  siteId: string;
  siteName: string;
  existingReport?: Report | null;
  onSuccess?: () => void;
  onDelete?: () => void;
}

export function ReportForm({ siteId, siteName, existingReport, onSuccess, onDelete }: ReportFormProps) {
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>("moderate");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (existingReport) {
      setCrowdLevel(existingReport.crowd_level as CrowdLevel);
      setContent(existingReport.content || "");
    }
  }, [existingReport]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Check if user is authenticated
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        return;
      }

      if (existingReport) {
        await updateReport(existingReport.id, crowdLevel, content || undefined);
      } else {
        await submitReport(siteId, crowdLevel, content || undefined);
      }
      setSuccess(true);
      onSuccess?.();

      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReport || !confirm("Are you sure you want to delete this report?")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      // Check if user is authenticated
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        return;
      }

      const response = await fetch(`/api/reports/${existingReport.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Delete error response:", errorData, response.status);
        throw new Error(errorData.error || `Failed to delete report (${response.status})`);
      }

      const data = await response.json();
      console.log("Delete successful:", data);
      setSuccess(true);
      onDelete?.();
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete report");
    } finally {
      setDeleting(false);
    }
  };

  const crowdLevelOptions: { value: CrowdLevel; label: string; color: string }[] = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "moderate", label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" },
  ];

  return (
    <>
      {/* Sign-in prompt modal */}
      {isAuthenticated === false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                Please sign in to submit crowd reports. Your reports help other users stay informed about current conditions at popular sites.
              </p>
              <div className="flex gap-3">
                <a
                  href="/auth/login"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-center font-medium hover:bg-blue-600 transition-colors"
                >
                  Sign In
                </a>
                <button
                  onClick={() => setIsAuthenticated(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded text-center font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded text-sm">
            {existingReport ? "Report updated successfully!" : "Report submitted successfully!"}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Crowd Level Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-800">Crowd Level</label>
          <div className="grid grid-cols-2 gap-2">
            {crowdLevelOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCrowdLevel(option.value)}
                className={`p-2 rounded text-sm font-semibold transition-all ${
                  crowdLevel === option.value
                    ? `${option.color} ring-2 ring-offset-1`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-800">Notes (optional)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add any additional details..."
            maxLength={500}
            className="w-full p-2 border rounded text-sm resize-none bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">{content.length}/500</p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Submitting..." : existingReport ? "Update Report" : "Submit Report"}
          </Button>
          {existingReport && (
            <Button
              type="button"
              disabled={deleting}
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </form>
    </div>
    </>
  );
}
