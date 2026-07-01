import type { CommunityType } from "@/lib/database.types";
import type { Community, CommunityWithCount } from "@/lib/types";
import { demonym } from "@/lib/countries";
import { slugToken } from "@/lib/utils";
import { QUIET_THRESHOLD } from "@/lib/constants";

export interface CommunityBlueprint {
  name: string;
  slug: string;
  type: CommunityType;
  country: string | null;
  city: string | null;
  home_country: string | null;
}

export interface ProfileLocation {
  home_country?: string | null;
  current_country?: string | null;
  city?: string | null;
}

/**
 * The natural key used to deduplicate communities. Two profiles with the same
 * location must resolve to the SAME slug so we reuse the existing community
 * instead of creating a duplicate (spec §3).
 */
export function buildCommunitySlug(
  type: CommunityType,
  parts: { country?: string | null; city?: string | null; home?: string | null },
): string {
  const country = parts.country ? slugToken(parts.country) : "";
  const city = parts.city ? slugToken(parts.city) : "";
  const home = parts.home ? slugToken(parts.home) : "";
  switch (type) {
    case "global":
      return "global";
    case "country":
      return `country:${country}`;
    case "city":
      return `city:${country}:${city}`;
    case "diaspora":
      return `diaspora:${home}:${country}`;
    case "hybrid":
      return `hybrid:${home}:${country}:${city}`;
  }
}

/**
 * Everything a profile should belong to. Naming follows the spec exactly:
 *   "{Demonym} in {CurrentCountry}"   e.g. "Spanish in Norway"   (diaspora)
 *   "{Demonym} in {City}"             e.g. "Spanish in Bergen"   (hybrid)
 *   "{CurrentCountry} - {City}"       e.g. "Norway - Bergen"     (city)
 *   "{CurrentCountry}"                e.g. "Norway"              (country)
 *   "Global"                                                     (global)
 */
export function generateCommunitiesForProfile(p: ProfileLocation): CommunityBlueprint[] {
  const out: CommunityBlueprint[] = [];
  const current = p.current_country?.trim() || null;
  const home = p.home_country?.trim() || null;
  const city = p.city?.trim() || null;

  // 1. Global — everyone.
  out.push({
    name: "Global",
    slug: buildCommunitySlug("global", {}),
    type: "global",
    country: null,
    city: null,
    home_country: null,
  });

  if (current) {
    // 2. Country.
    out.push({
      name: current,
      slug: buildCommunitySlug("country", { country: current }),
      type: "country",
      country: current,
      city: null,
      home_country: null,
    });

    // 3. City.
    if (city) {
      out.push({
        name: `${current} - ${city}`,
        slug: buildCommunitySlug("city", { country: current, city }),
        type: "city",
        country: current,
        city,
        home_country: null,
      });
    }
  }

  // Diaspora communities only make sense when home differs from current.
  const isExpat = home && current && slugToken(home) !== slugToken(current);
  if (isExpat) {
    // 4. Home diaspora in current country.
    out.push({
      name: `${demonym(home)} in ${current}`,
      slug: buildCommunitySlug("diaspora", { home, country: current }),
      type: "diaspora",
      country: current,
      city: null,
      home_country: home,
    });

    // 5. Home diaspora in the specific city.
    if (city) {
      out.push({
        name: `${demonym(home)} in ${city}`,
        slug: buildCommunitySlug("hybrid", { home, country: current, city }),
        type: "hybrid",
        country: current,
        city,
        home_country: home,
      });
    }
  }

  return out;
}

const LANDING_PRIORITY: CommunityType[] = ["hybrid", "diaspora", "city", "country", "global"];

/**
 * Entry-flow landing pick (spec §1/§3). Prefer the most specific community that
 * is active enough not to feel empty; fall back down the hierarchy, and never
 * return nothing when the user has any community at all.
 */
export function pickLandingCommunity(
  communities: CommunityWithCount[],
): CommunityWithCount | null {
  if (communities.length === 0) return null;

  for (const type of LANDING_PRIORITY) {
    const match = communities
      .filter((c) => c.type === type)
      .sort((a, b) => b.member_count - a.member_count)[0];
    if (!match) continue;
    // City / hybrid must clear the quiet threshold; diaspora/country/global
    // are always acceptable landing spots.
    if ((type === "city" || type === "hybrid") && match.member_count < QUIET_THRESHOLD) {
      continue;
    }
    return match;
  }

  // Fallback: whichever community has the most members.
  return [...communities].sort((a, b) => b.member_count - a.member_count)[0];
}

/** Order for the sidebar: broad, welcoming context first isn't the goal —
 *  most specific/relevant first, global last. */
const SIDEBAR_ORDER: Record<CommunityType, number> = {
  hybrid: 0,
  diaspora: 1,
  city: 2,
  country: 3,
  global: 4,
};

export function sortCommunitiesForSidebar<T extends Community>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => SIDEBAR_ORDER[a.type] - SIDEBAR_ORDER[b.type] || a.name.localeCompare(b.name),
  );
}

/** Suggest a broader sibling when a community is quiet (spec §7 empty state). */
export function broaderSuggestion(
  active: CommunityWithCount,
  all: CommunityWithCount[],
): CommunityWithCount | null {
  const fallbackType: Partial<Record<CommunityType, CommunityType[]>> = {
    hybrid: ["diaspora", "city", "country", "global"],
    city: ["country", "global"],
    diaspora: ["country", "global"],
    country: ["global"],
    global: [],
  };
  for (const type of fallbackType[active.type] ?? []) {
    const candidate = all
      .filter((c) => c.type === type && c.id !== active.id)
      .sort((a, b) => b.member_count - a.member_count)[0];
    if (candidate) return candidate;
  }
  return null;
}
