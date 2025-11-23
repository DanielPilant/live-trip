import { AuthButton } from "@/components/auth/auth-button";
import { getSites } from "@/lib/services/site-service";
import MapView from "@/components/map";
import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";

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
        <Suspense>
          <AuthButton />
        </Suspense>
      </div>

      {/* Bottom Left Logo Button */}
      <div className="absolute bottom-8 left-4 z-10">
        <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors">
          <Logo className="h-8 w-8" />
        </button>
      </div>
    </main>
  );
}

