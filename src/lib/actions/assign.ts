import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateCommunitiesForProfile,
  type ProfileLocation,
} from "@/lib/communities";

/**
 * Idempotently ensure every community implied by a profile's location exists
 * (dedup by slug) and that the user is a member of each. Uses the service role
 * because it must create shared communities that other users will join.
 *
 * Safe to run on signup AND on every profile update — existing communities are
 * reused, memberships are upserted, and communities that no longer apply are
 * left in place (other users may still belong to them).
 */
export async function assignCommunities(userId: string, location: ProfileLocation) {
  const admin = createAdminClient();
  const blueprints = generateCommunitiesForProfile(location);

  // 1. Upsert communities on their natural key (slug) and read back ids.
  const { data: communities, error: upsertErr } = await admin
    .from("communities")
    .upsert(blueprints, { onConflict: "slug" })
    .select("id, slug");

  if (upsertErr) throw upsertErr;

  const ids = (communities ?? []).map((c) => c.id);

  // 2. Upsert memberships as auto-assigned (ignoreDuplicates keeps any existing
  //    manual membership as manual).
  const { error: memberErr } = await admin
    .from("memberships")
    .upsert(
      ids.map((community_id) => ({ user_id: userId, community_id, source: "auto" as const })),
      { onConflict: "user_id,community_id", ignoreDuplicates: true },
    );

  if (memberErr) throw memberErr;

  // 3. Reconcile: remove auto memberships that no longer match the profile
  //    (e.g. the old country/city after the user moved). Manually-joined
  //    communities (source = 'manual') are never pruned.
  if (ids.length > 0) {
    const { error: pruneErr } = await admin
      .from("memberships")
      .delete()
      .eq("user_id", userId)
      .eq("source", "auto")
      .not("community_id", "in", `(${ids.join(",")})`);
    if (pruneErr) throw pruneErr;
  }

  return communities ?? [];
}
