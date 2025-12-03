import { getSites } from "@/lib/services/site-service";
import { HomeView } from "@/components/home/home-view";
import { AuthButton } from "@/components/auth/auth-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sites = await getSites();

  return <HomeView sites={sites} authButton={<AuthButton />} />;
}
