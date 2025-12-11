import { getSites } from "@/lib/services/site-service";
import { getUser } from "@/lib/services/auth-service";
import { HomeView } from "@/components/home/home-view";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sites = await getSites();
  const user = await getUser();

  return <HomeView sites={sites} user={user} />;
}
