"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Home, LayoutGrid, Search, User as UserIcon, X } from "lucide-react";
import type { CommunityWithCount, Profile } from "@/lib/types";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { UserMenu } from "@/components/app/user-menu";
import { cn } from "@/lib/utils";

export function MobileNav({
  profile,
  communities,
  activeCommunityId,
}: {
  profile: Profile;
  communities: CommunityWithCount[];
  activeCommunityId?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const tab = (href: string, active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] font-medium transition-colors",
      active ? "text-primary" : "text-muted-foreground",
    );

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className={tab("", pathname.startsWith("/app/c/"))}>
            <LayoutGrid className="size-5" />
            Fellesskap
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[86%] max-w-xs data-[state=open]:animate-in data-[state=open]:slide-in-from-left">
              <Dialog.Title className="sr-only">Fellesskap</Dialog.Title>
              <div className="flex h-full flex-col">
                <div className="flex min-h-0 flex-1 flex-col">
                  <SidebarNav
                    communities={communities}
                    activeCommunityId={activeCommunityId}
                    onNavigate={() => setOpen(false)}
                  />
                </div>
                <UserMenu profile={profile} onNavigate={() => setOpen(false)} />
              </div>
              <Dialog.Close className="absolute right-3 top-3 rounded-md p-1 text-sidebar-foreground/70">
                <X className="size-5" />
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Link href="/app/feed" className={tab("", pathname === "/app/feed")}>
          <Home className="size-5" />
          Feed
        </Link>
        <Link href="/app/search" className={tab("", pathname === "/app/search")}>
          <Search className="size-5" />
          Søk
        </Link>
        <Link href="/app/profile" className={tab("", pathname === "/app/profile")}>
          <UserIcon className="size-5" />
          Profil
        </Link>
      </nav>
    </>
  );
}
