"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { HomeLinkMark } from "@/components/brand";
import { CountrySelect } from "@/components/form/country-select";
import { ChipSelect } from "@/components/form/chip-select";
import { CITIES, INTERESTS, LANGUAGES } from "@/lib/countries";
import { generateCommunitiesForProfile } from "@/lib/communities";

const STEPS = ["Deg", "Opprinnelse", "Hvor du bor", "Interesser"] as const;

export function OnboardingWizard({
  userId,
  initialName,
  initialAvatar,
}: {
  userId: string;
  initialName: string;
  initialAvatar: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [homeCountry, setHomeCountry] = useState("");
  const [currentCountry, setCurrentCountry] = useState("");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const preview = useMemo(
    () =>
      generateCommunitiesForProfile({
        home_country: homeCountry,
        current_country: currentCountry,
        city,
      }),
    [homeCountry, currentCountry, city],
  );

  const canAdvance = [
    name.trim().length > 0,
    homeCountry.length > 0,
    currentCountry.length > 0 && city.trim().length > 0,
    true,
  ][step];

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleAvatar(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch {
      toast.error("Kunne ikke laste opp bilde", {
        description: "Sjekk at «avatars»-bøtta finnes i Supabase Storage. Du kan hoppe over dette.",
      });
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    startTransition(async () => {
      const res = await completeOnboarding({
        name,
        avatar_url: avatarUrl,
        home_country: homeCountry,
        current_country: currentCountry,
        city,
        languages,
        interests,
      });
      if (res.ok) {
        toast.success("Velkommen til HomeLink! 🎉");
        router.push("/app");
        router.refresh();
      } else {
        toast.error("Noe gikk galt", { description: res.error });
      }
    });
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background bg-dots p-4">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center gap-2">
          <HomeLinkMark className="size-8" />
          <span className="font-semibold">HomeLink</span>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-border"
                }`}
              />
              <span
                className={`mt-1.5 hidden text-xs sm:block ${
                  i === step ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <div className="space-y-6">
                  <Header title="La oss bli kjent" sub="Slik ser andre deg i fellesskapene." />
                  <div className="flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="group relative rounded-full outline-none"
                    >
                      <UserAvatar name={name} avatarUrl={avatarUrl} seed={userId} className="size-24 text-2xl" />
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        {uploading ? (
                          <Loader2 className="size-5 animate-spin text-white" />
                        ) : (
                          <Camera className="size-5 text-white" />
                        )}
                      </span>
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])}
                    />
                    <span className="text-xs text-muted-foreground">Trykk for å legge til bilde (valgfritt)</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Navn</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Fornavn Etternavn"
                      className="h-11"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <Header title="Hvor er du fra?" sub="Vi kobler deg til andre fra hjemlandet ditt." />
                  <div className="space-y-1.5">
                    <Label>Hjemland</Label>
                    <CountrySelect value={homeCountry} onChange={setHomeCountry} placeholder="Velg hjemland" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <Header title="Hvor bor du nå?" sub="Så finner du naboer og lokale arrangementer." />
                  <div className="space-y-1.5">
                    <Label>Nåværende land</Label>
                    <CountrySelect
                      value={currentCountry}
                      onChange={setCurrentCountry}
                      placeholder="Velg land du bor i"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">By</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="F.eks. Bergen"
                      className="h-11"
                      list="city-suggestions"
                    />
                    <datalist id="city-suggestions">
                      {CITIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {CITIES.slice(0, 6).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCity(c)}
                          className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <Header title="Hva er du interessert i?" sub="Valgfritt — hjelper deg å finne ditt folk." />
                  <div className="space-y-2">
                    <Label>Språk du snakker</Label>
                    <ChipSelect
                      options={LANGUAGES}
                      selected={languages}
                      onToggle={(v) => toggle(languages, setLanguages, v)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interesser</Label>
                    <ChipSelect
                      options={INTERESTS}
                      selected={interests}
                      onToggle={(v) => toggle(interests, setInterests, v)}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Live community preview */}
          {preview.length > 1 && (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Du blir med i {preview.length} fellesskap
              </div>
              <div className="flex flex-wrap gap-1.5">
                {preview.map((c) => (
                  <span
                    key={c.slug}
                    className="rounded-full bg-card px-2.5 py-1 text-xs text-foreground/80 shadow-xs"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || pending}
              className={step === 0 ? "invisible" : ""}
            >
              <ArrowLeft className="size-4" /> Tilbake
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                Neste <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Fullfør
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-[-0.01em]">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
