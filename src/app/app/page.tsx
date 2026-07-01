import { redirect } from "next/navigation";
import { getMyCommunities } from "@/lib/data";
import { pickLandingCommunity } from "@/lib/communities";

export const dynamic = "force-dynamic";

// Entry flow (spec §1): resolve the best landing community, then drop the user
// straight into its General chat. No communities → finish onboarding.
export default async function AppEntryPage() {
  const communities = await getMyCommunities();
  if (communities.length === 0) redirect("/onboarding");

  const landing = pickLandingCommunity(communities);
  if (!landing) redirect("/app/feed");

  redirect(`/app/c/${landing.id}?view=chat&channel=general`);
}
