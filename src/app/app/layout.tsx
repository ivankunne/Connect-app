import { redirect } from "next/navigation";
import { getDmUnreadTotal, getMyCommunities, getMyProfile, getUnreadCounts } from "@/lib/data";
import { sortCommunitiesForSidebar } from "@/lib/communities";
import { AppShell } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarded) redirect("/onboarding");

  const [communities, unreadCounts, dmUnread] = await Promise.all([
    getMyCommunities(),
    getUnreadCounts(),
    getDmUnreadTotal(),
  ]);

  return (
    <AppShell
      profile={profile}
      communities={sortCommunitiesForSidebar(communities)}
      unreadCounts={unreadCounts}
      dmUnread={dmUnread}
    >
      {children}
    </AppShell>
  );
}
