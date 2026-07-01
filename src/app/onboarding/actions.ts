"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assignCommunities } from "@/lib/actions/assign";

export interface OnboardingInput {
  name: string;
  avatar_url?: string | null;
  home_country: string;
  current_country: string;
  city: string;
  languages: string[];
  interests: string[];
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function completeOnboarding(input: OnboardingInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Ikke innlogget." };

  if (!input.name.trim() || !input.home_country || !input.current_country || !input.city.trim()) {
    return { ok: false, error: "Fyll ut navn, hjemland, nåværende land og by." };
  }

  // 1. Save the profile (RLS: user updates their own row).
  const { error: profileErr } = await supabase
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

  if (profileErr) return { ok: false, error: profileErr.message };

  // 2. Generate + join all relevant communities (service role).
  try {
    await assignCommunities(user.id, {
      home_country: input.home_country,
      current_country: input.current_country,
      city: input.city.trim(),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Kunne ikke sette opp fellesskap.",
    };
  }

  revalidatePath("/app", "layout");
  return { ok: true };
}
