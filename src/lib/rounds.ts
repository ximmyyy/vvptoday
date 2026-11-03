import type { Round } from "./types";

export const TZ = "Europe/Amsterdam";

export type Phase = "draft" | "upcoming" | "open" | "counting" | "finished";

export function roundPhase(r: Round, now = new Date()): Phase {
  if (!r.published) return "draft";
  if (r.winner_goal_id) return "finished";
  if (now < new Date(r.starts_at)) return "upcoming";
  if (now < new Date(r.ends_at)) return "open";
  return "counting";
}

export const phaseLabel: Record<Phase, string> = {
  draft: "Concept",
  upcoming: "Gepland",
  open: "Stemmen open",
  counting: "Gesloten – winnaar kiezen",
  finished: "Afgerond",
};

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("nl-NL", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function tzOffsetMinutes(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(d);
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
  return (asUTC - d.getTime()) / 60000;
}

/** "2026-11-01T00:00" (Nederlandse tijd) -> ISO-string in UTC */
export function amsterdamLocalToISO(local: string) {
  const guess = new Date(`${local}:00Z`);
  const first = new Date(guess.getTime() - tzOffsetMinutes(guess) * 60000);
  // tweede pass voor correcte afhandeling rond zomer-/wintertijd
  return new Date(guess.getTime() - tzOffsetMinutes(first) * 60000).toISOString();
}

/** ISO-string -> "2026-11-01T00:00" in Nederlandse tijd (voor datetime-local inputs) */
export function isoToAmsterdamLocal(iso: string) {
  return new Date(iso)
    .toLocaleString("sv-SE", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(" ", "T");
}

export function videoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/goal-videos/${path}`;
}
