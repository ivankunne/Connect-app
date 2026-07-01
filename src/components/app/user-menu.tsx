"use client";

import Link from "next/link";
import { LogOut, User as UserIcon, ChevronsUpDown } from "lucide-react";
import type { Profile } from "@/lib/types";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { flagFor } from "@/lib/countries";

export function UserMenu({ profile, onNavigate }: { profile: Profile; onNavigate?: () => void }) {
  return (
    <div className="border-t border-white/10 p-2.5">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none transition-colors hover:bg-white/[0.06]">
          <UserAvatar name={profile.name} avatarUrl={profile.avatar_url} seed={profile.id} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-sidebar-foreground">{profile.name}</div>
            <div className="truncate text-xs text-sidebar-muted">
              {flagFor(profile.home_country)} → {flagFor(profile.current_country)} {profile.city}
            </div>
          </div>
          <ChevronsUpDown className="size-4 text-sidebar-muted" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuItem asChild onClick={onNavigate}>
            <Link href="/app/profile">
              <UserIcon /> Min profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action="/auth/signout" method="post">
            <button type="submit" className="w-full">
              <DropdownMenuItem asChild>
                <span className="text-destructive [&_svg]:text-destructive">
                  <LogOut /> Logg ut
                </span>
              </DropdownMenuItem>
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
