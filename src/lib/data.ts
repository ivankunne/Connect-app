import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CommunityWithCount, Profile } from "@/lib/types";

/** Current authenticated user (verified against Supabase). */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** The signed-in user's profile row (or null). */
export const getMyProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
});

/** Communities the user belongs to, with live member counts. */
export const getMyCommunities = cache(async (): Promise<CommunityWithCount[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("memberships")
    .select("community_id")
    .eq("user_id", user.id);

  const ids = (rows ?? []).map((r) => r.community_id);
  if (ids.length === 0) return [];

  const { data: communities } = await supabase
    .from("communities_with_counts")
    .select("*")
    .in("id", ids);

  return communities ?? [];
});
