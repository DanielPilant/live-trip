import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { getSites } from "@/lib/services/site-service";
import MapView from "@/components/map";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sites = await getSites();

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-10 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Live Trip</Link>
            </div>
            <div className="flex gap-4 items-center">
              <ThemeSwitcher />
              {hasEnvVars && (
                <Suspense>
                  <AuthButton />
                </Suspense>
              )}
            </div>
          </div>
        </nav>

        <div className="flex-1 w-full max-w-5xl p-5 flex flex-col gap-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Explore Live Crowds</h1>
            <p className="text-xl text-muted-foreground">
              Plan your trip with real-time crowd reports and insights.
            </p>
          </div>

          <div className="w-full h-[500px] border rounded-lg overflow-hidden shadow-lg">
            <MapView sites={sites} />
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
