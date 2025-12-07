"use client";

import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { ArrowLeft, Mail, User as UserIcon, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Report } from "@/lib/types";
import { getUserReports, getUserStatistics } from "@/lib/services/profile-service";

interface ProfileViewProps {
  user: User;
}

export function ProfileView({ user }: ProfileViewProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserReports = async () => {
      try {
        setIsLoading(true);
        // השתמש בProfileService במקום בSupabase ישירות
        const reports = await getUserReports(user.id);
        setReports(reports);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user.id) {
      fetchUserReports();
    }
  }, [user.id]);

  const userMetadata = user.user_metadata || {};
  const fullName = userMetadata.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl =
    userMetadata.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      {/* Header with Back Button */}
      <div className="flex justify-between items-center max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-xl rounded-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32 md:h-48"></div>

          <div className="px-6 md:px-8 pb-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col md:flex-row md:items-end md:gap-6 -mt-16 md:-mt-20 mb-8">
              <img
                src={avatarUrl}
                alt={fullName}
                className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white shadow-lg"
                referrerPolicy="no-referrer"
              />
              <div className="mt-4 md:mt-0 md:pb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {fullName}
                </h1>
                <p className="text-gray-600 text-lg">{user.email}</p>
              </div>
            </div>

            {/* Account Details Section */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* User Info */}
              <Card className="bg-gray-50 border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Account Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="text-gray-900 font-medium">{fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </p>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User ID</p>
                    <p className="text-gray-600 text-sm font-mono">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Created</p>
                    <p className="text-gray-900 font-medium">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("en-US")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Statistics */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Statistics
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Your Reports</p>
                    <p className="text-3xl font-bold text-indigo-600">
                      {reports.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Sites</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {new Set(reports.map((r) => r.site_id)).size}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Reports */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Recent Reports
              </h2>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : reports.length === 0 ? (
                <Card className="bg-gray-50 border-gray-200 p-6 text-center">
                  <p className="text-gray-600">You haven't added any reports yet</p>
                  <Link href="/">
                    <Button className="mt-4">Go Home & Submit a Report</Button>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reports.slice(0, 5).map((report) => (
                    <Card
                      key={report.id}
                      className="bg-white border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {report.site_id}
                          </p>
                          {report.content && (
                            <p className="text-gray-600 text-sm mt-1">
                              {report.content}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {report.crowd_level}
                          </span>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(report.created_at).toLocaleDateString(
                              "en-US"
                            )}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
