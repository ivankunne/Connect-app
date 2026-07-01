"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assignCommunities } from "@/lib/actions/assign";
import type { ActionResult } from "@/app/onboarding/actions";

export interface ProfileUpdateInput {
  name: string;
  avatar_url?: string | null;
  home_country: string;
  current_country: string;
  city: string;
  languages: string[];
  interests: string[];
}

export async function updateProfile(input: ProfileUpdateInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Ikke innlogget." };

  if (!input.name.trim() || !input.home_country || !input.current_country || !input.city.trim()) {
    return { ok: false, error: "Navn, hjemland, nåværende land og by er påkrevd." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: input.name.trim(),
      avatar_url: input.avatar_url || null,
      home_country: input.home_country,
      current_country: input.current_country,
      city: input.city.trim(),
      languages: input.languages,
      interests: input.interests,
      onboarded: true,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  // Location may have changed → ensure new communities exist and the user joins.
  try {
    await assignCommunities(user.id, {
      home_country: input.home_country,
      current_country: input.current_country,
      city: input.city.trim(),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Kunne ikke oppdatere fellesskap." };
  }

  revalidatePath("/app", "layout");
  return { ok: true };
}
