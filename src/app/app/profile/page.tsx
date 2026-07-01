import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getMyProfile } from "@/lib/data";
import { ProfileEditor } from "@/components/profile/profile-editor";

export const metadata: Metadata = { title: "Min profil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-card/80 px-4 py-3.5 backdrop-blur sm:px-6">
        <h1 className="font-display text-lg font-semibold tracking-[-0.01em]">Min profil</h1>
        <p className="text-xs text-muted-foreground">Rediger informasjonen din</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <ProfileEditor profile={profile} />
      </div>
    </div>
  );
}
