"use client";

import { useParams } from "next/navigation";
import type { CommunityWithCount, Profile } from "@/lib/types";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { UserMenu } from "@/components/app/user-menu";
import { MobileNav } from "@/components/app/mobile-nav";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({
  profile,
  communities,
  unreadCounts,
  dmUnread,
  children,
}: {
  profile: Profile;
  communities: CommunityWithCount[];
  unreadCounts: Record<string, number>;
  dmUnread: number;
  children: React.ReactNode;
}) {
  const params = useParams();
  const activeCommunityId = typeof params.communityId === "string" ? params.communityId : undefined;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-svh overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden w-[272px] shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
          <div className="flex min-h-0 flex-1 flex-col">
            <SidebarNav
              communities={communities}
              activeCommunityId={activeCommunityId}
              unreadCounts={unreadCounts}
              dmUnread={dmUnread}
            />
          </div>
          <UserMenu profile={profile} />
        </aside>

        {/* Main */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav + drawer */}
        <MobileNav
          profile={profile}
          communities={communities}
          activeCommunityId={activeCommunityId}
          unreadCounts={unreadCounts}
          dmUnread={dmUnread}
        />
      </div>
    </TooltipProvider>
  );
}
