"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addGoal } from "@/app/admin/actions";

const MAX_MB = 50;

export function UploadGoal({ roundId }: { roundId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const file = form.get("video") as File;
    if (!file?.size) return setError("Kies een video.");
    if (file.size > MAX_MB * 1024 * 1024) {
      return setError(`Video is groter dan ${MAX_MB} MB. Exporteer hem kleiner (bv. 1080p) en probeer opnieuw.`);
    }

    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const path = `${roundId}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error: upErr } = await supabase.storage
      .from("goal-videos")
      .upload(path, file, { contentType: file.type || "video/mp4", cacheControl: "31536000" });
    if (upErr) {
      setBusy(false);
      return setError(`Upload mislukt: ${upErr.message}`);
    }

    const s = (k: string) => (String(form.get(k) ?? "").trim() || null);
    const err = await addGoal({
      round_id: roundId,
      player_name: s("player_name")!,
      team: s("team"),
      opponent: s("opponent"),
      match_date: s("match_date"),
      description: s("description"),
      video_path: path,
    });
    setBusy(false);
    if (err) {
      await supabase.storage.from("goal-videos").remove([path]);
      return setError(err);
    }
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="video">Video (mp4/mov, max {MAX_MB} MB)</label>
        <input id="video" name="video" type="file" accept="video/mp4,video/quicktime,video/webm" required
          className="input file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1 file:font-semibold file:text-accent-ink" />
      </div>
      <div>
        <label className="label" htmlFor="player_name">Speler *</label>
        <input id="player_name" name="player_name" required className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="team">Team</label>
          <input id="team" name="team" placeholder="Zaterdag 1" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="match_date">Datum</label>
          <input id="match_date" name="match_date" type="date" className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="opponent">Tegenstander</label>
        <input id="opponent" name="opponent" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="description">Omschrijving</label>
        <input id="description" name="description" placeholder="Volley in de kruising vanaf 25 meter" className="input" />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button className="btn-accent w-full" disabled={busy}>{busy ? "Uploaden… (even geduld)" : "Goal toevoegen"}</button>
    </form>
  );
}
