import { redirect } from "next/navigation";
import { getUser } from "@/lib/services/auth-service";
import { ProfileView } from "@/components/profile/profile-view";

export default async function ProfilePage() {
  const user = await getUser();

  // Redirect to home if not authenticated
  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ProfileView user={user} />
    </div>
  );
}
