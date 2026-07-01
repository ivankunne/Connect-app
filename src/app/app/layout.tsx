import { redirect } from "next/navigation";
import { getMyCommunities, getMyProfile } from "@/lib/data";
import { sortCommunitiesForSidebar } from "@/lib/communities";
import { AppShell } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarded) redirect("/onboarding");

  const communities = sortCommunitiesForSidebar(await getMyCommunities());

  return (
    <AppShell profile={profile} communities={communities}>
      {children}
    </AppShell>
  );
}
