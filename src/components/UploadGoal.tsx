"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addGoal, addGoalVideo } from "@/app/admin/actions";

const MAX_MB = 50;
const ACCEPT = "video/mp4,video/quicktime,video/webm";

/** Uploadt een video naar Supabase Storage en geeft het pad terug (of een foutmelding). */
async function uploadVideo(roundId: string, file: File): Promise<{ path?: string; error?: string }> {
  if (!file?.size) return { error: "Kies een video." };
  if (file.size > MAX_MB * 1024 * 1024) {
    return {
      error: `Video is ${Math.round(file.size / 1024 / 1024)} MB, max is ${MAX_MB} MB. Knip hem korter of exporteer met een lagere bitrate (1080p, ±8 Mbps).`,
    };
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${roundId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await createClient()
    .storage.from("goal-videos")
    .upload(path, file, { contentType: file.type || "video/mp4", cacheControl: "31536000" });
  return error ? { error: `Upload mislukt: ${error.message}` } : { path };
}

async function removeVideo(path: string) {
  await createClient().storage.from("goal-videos").remove([path]);
}

function AngleFields({ defaultLabel }: { defaultLabel: string }) {
  return (
    <>
      <div>
        <label className="label">Video (liggend 16:9, max {MAX_MB} MB)</label>
        <input name="video" type="file" accept={ACCEPT} required
          className="input file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1 file:font-semibold file:text-accent-ink" />
      </div>
      <div>
        <label className="label">Camerahoek</label>
        <input name="label" defaultValue={defaultLabel} required list="angle-labels" className="input" />
        <datalist id="angle-labels">
          <option value="Veo" />
          <option value="Camera" />
          <option value="Langs de lijn" />
          <option value="Achter de goal" />
        </datalist>
      </div>
    </>
  );
}

export function UploadGoal({ roundId }: { roundId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const up = await uploadVideo(roundId, form.get("video") as File);
    if (!up.path) {
      setBusy(false);
      return setError(up.error!);
    }
    const s = (k: string) => String(form.get(k) ?? "").trim() || null;
    const err = await addGoal({
      round_id: roundId,
      player_name: s("player_name")!,
      team: s("team"),
      opponent: s("opponent"),
      match_date: s("match_date"),
      description: s("description"),
      video: { label: s("label") ?? "Veo", path: up.path },
    });
    setBusy(false);
    if (err) {
      await removeVideo(up.path);
      return setError(err);
    }
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <AngleFields defaultLabel="Veo" />
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
      <p className="text-xs text-muted">Extra camerahoeken voeg je daarna toe bij de goal zelf.</p>
    </form>
  );
}

/** Extra camerahoek uploaden bij een bestaande goal. */
export function AddAngle({ roundId, goalId }: { roundId: string; goalId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const up = await uploadVideo(roundId, form.get("video") as File);
    if (!up.path) {
      setBusy(false);
      return setError(up.error!);
    }
    const err = await addGoalVideo({
      goal_id: goalId,
      round_id: roundId,
      label: String(form.get("label") ?? "").trim() || "Camera",
      path: up.path,
    });
    setBusy(false);
    if (err) {
      await removeVideo(up.path);
      return setError(err);
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" className="btn-ghost !py-1.5 text-sm" onClick={() => setOpen(true)}>
        + Camerahoek toevoegen
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg border border-white/10 p-3">
      <AngleFields defaultLabel="Camera" />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-ghost flex-1 !py-1.5 text-sm" onClick={() => setOpen(false)}>Annuleren</button>
        <button className="btn-accent flex-1 !py-1.5 text-sm" disabled={busy}>{busy ? "Uploaden…" : "Uploaden"}</button>
      </div>
    </form>
  );
}
