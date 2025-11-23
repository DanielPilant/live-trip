import { AuthButton } from "@/components/auth/auth-button";
import { hasEnvVars } from "@/lib/utils";
import { getSites } from "@/lib/services/site-service";
import MapView from "@/components/map";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sites = await getSites();

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapView sites={sites} />
      </div>

      {/* Top Right Auth Button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {hasEnvVars && (
          <Suspense>
            <AuthButton />
          </Suspense>
        )}
      </div>
    </main>
  );
}
