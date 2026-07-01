import { Globe } from "lucide-react";
import type { Community } from "@/lib/types";
import { flagFor } from "@/lib/countries";
import { cn } from "@/lib/utils";

/** Visual token for a community: home flag for diaspora, country flag for
 *  country/city, a globe for Global. */
export function communityGlyph(c: Pick<Community, "type" | "country" | "home_country">): string {
  if (c.type === "global") return "🌍";
  if (c.type === "diaspora" || c.type === "hybrid") return flagFor(c.home_country);
  return flagFor(c.country);
}

export function CommunityAvatar({
  community,
  className,
}: {
  community: Pick<Community, "type" | "country" | "home_country" | "name">;
  className?: string;
}) {
  const glyph = communityGlyph(community);
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg shadow-inner",
        className,
      )}
    >
      {community.type === "global" ? <Globe className="size-5 text-white/90" /> : glyph}
    </span>
  );
}
