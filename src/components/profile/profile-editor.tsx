"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/app/profile/actions";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { CountrySelect } from "@/components/form/country-select";
import { ChipSelect } from "@/components/form/chip-select";
import { CITIES, INTERESTS, LANGUAGES } from "@/lib/countries";

export function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [homeCountry, setHomeCountry] = useState(profile.home_country ?? "");
  const [currentCountry, setCurrentCountry] = useState(profile.current_country ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? []);
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleAvatar(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch {
      toast.error("Kunne ikke laste opp bilde");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    startTransition(async () => {
      const res = await updateProfile({
        name,
        avatar_url: avatarUrl,
        home_country: homeCountry,
        current_country: currentCountry,
        city,
        languages,
        interests,
      });
      if (res.ok) {
        toast.success("Profil oppdatert");
        router.refresh();
      } else {
        toast.error("Noe gikk galt", { description: res.error });
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => fileRef.current?.click()} className="group relative rounded-full">
          <UserAvatar name={name} avatarUrl={avatarUrl} seed={profile.id} className="size-20 text-xl" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? <Loader2 className="size-5 animate-spin text-white" /> : <Camera className="size-5 text-white" />}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])}
        />
        <div>
          <h2 className="text-lg font-semibold">{name || "Din profil"}</h2>
          <p className="text-sm text-muted-foreground">Trykk på bildet for å endre</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-name">Navn</Label>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Hjemland</Label>
          <CountrySelect value={homeCountry} onChange={setHomeCountry} />
        </div>
        <div className="space-y-1.5">
          <Label>Nåværende land</Label>
          <CountrySelect value={currentCountry} onChange={setCurrentCountry} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-city">By</Label>
        <Input id="p-city" value={city} onChange={(e) => setCity(e.target.value)} className="h-11" list="p-cities" />
        <datalist id="p-cities">
          {CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <Label>Språk</Label>
        <ChipSelect options={LANGUAGES} selected={languages} onToggle={(v) => toggle(languages, setLanguages, v)} />
      </div>

      <div className="space-y-2">
        <Label>Interesser</Label>
        <ChipSelect options={INTERESTS} selected={interests} onToggle={(v) => toggle(interests, setInterests, v)} />
      </div>

      <div className="rounded-xl border border-dashed border-border bg-surface p-3 text-xs text-muted-foreground">
        Endrer du by eller land, blir du automatisk med i de riktige fellesskapene.
      </div>

      <div className="flex justify-end gap-2 pb-4">
        <Button onClick={save} disabled={pending} size="lg">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Lagre endringer
        </Button>
      </div>
    </div>
  );
}
