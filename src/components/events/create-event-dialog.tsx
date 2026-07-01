"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toLocalInputValue } from "@/lib/time";

export function CreateEventDialog({
  communityId,
  currentUserId,
}: {
  communityId: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [datetime, setDatetime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return toLocalInputValue(d);
  });
  const [location, setLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");

  async function save() {
    if (!title.trim() || !datetime) {
      toast.error("Legg til tittel og tidspunkt");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("events")
      .insert({
        community_id: communityId,
        creator_id: currentUserId,
        title: title.trim(),
        description: description.trim() || null,
        datetime: new Date(datetime).toISOString(),
        location: location.trim() || null,
        max_attendees: maxAttendees ? Number(maxAttendees) : null,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Kunne ikke opprette arrangement", { description: error.message });
      setSaving(false);
      return;
    }

    // Creator auto-RSVPs "going".
    await supabase.from("event_attendees").upsert(
      { event_id: data.id, user_id: currentUserId, status: "going" },
      { onConflict: "event_id,user_id" },
    );

    toast.success("Arrangement opprettet 🎉");
    setSaving(false);
    setOpen(false);
    setTitle("");
    setDescription("");
    setLocation("");
    setMaxAttendees("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Nytt arrangement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Opprett arrangement</DialogTitle>
          <DialogDescription>Samle folk fra fellesskapet i det virkelige liv.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Tittel</Label>
            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="F.eks. Tapas-kveld i sentrum" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-desc">Beskrivelse</Label>
            <Textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Hva skjer, og hvem er det for?" rows={3} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ev-when">Dato & tid</Label>
              <Input id="ev-when" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-max">Maks antall (valgfritt)</Label>
              <Input id="ev-max" type="number" min={1} value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="Ubegrenset" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-loc">Sted</Label>
            <Input id="ev-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="F.eks. Café Opera, Bergen" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Opprett
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
