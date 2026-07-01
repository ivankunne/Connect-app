"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search } from "lucide-react";
import type { CommunityWithCount } from "@/lib/types";
import { CommunityAvatar } from "@/components/community-avatar";
import { HomeLinkMark } from "@/components/brand";
import { cn } from "@/lib/utils";
import { QUIET_THRESHOLD } from "@/lib/constants";

const TYPE_LABEL: Record<string, string> = {
  hybrid: "Ditt folk i byen",
  diaspora: "Diaspora",
  city: "By",
  country: "Land",
  global: "Global",
};

/** The community navigation, shared between the desktop rail and the mobile drawer. */
export function SidebarNav({
  communities,
  activeCommunityId,
  onNavigate,
}: {
  communities: CommunityWithCount[];
  activeCommunityId?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4">
        <HomeLinkMark className="size-8" />
        <span className="font-semibold tracking-tight">HomeLink</span>
      </div>

      <nav className="px-2.5">
        <NavLink href="/app/feed" icon={<Home className="size-4" />} active={pathname === "/app/feed"} onNavigate={onNavigate}>
          Feed
        </NavLink>
        <NavLink href="/app/search" icon={<Search className="size-4" />} active={pathname === "/app/search"} onNavigate={onNavigate}>
          Søk
        </NavLink>
      </nav>

      <div className="mt-4 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-sidebar-muted">
        Dine fellesskap
      </div>

      <div className="mt-1.5 flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-4 scrollbar-thin">
        {communities.map((c) => {
          const active = c.id === activeCommunityId;
          const quiet = c.member_count < QUIET_THRESHOLD;
          return (
            <Link
              key={c.id}
              href={`/app/c/${c.id}?view=chat&channel=general`}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors",
                active ? "bg-white/12" : "hover:bg-white/[0.06]",
              )}
            >
              <CommunityAvatar community={c} className="size-9 text-base" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{c.name}</div>
                <div className="truncate text-xs text-sidebar-muted">
                  {TYPE_LABEL[c.type]} · {c.member_count} {c.member_count === 1 ? "medlem" : "medlemmer"}
                </div>
              </div>
              {quiet && c.type !== "global" && (
                <span className="size-1.5 shrink-0 rounded-full bg-amber-400/80" title="Rolig fellesskap" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  active,
  children,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-white/12 text-sidebar-foreground" : "text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-foreground",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
