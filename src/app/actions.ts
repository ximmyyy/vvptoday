"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";
import { isValidEmail, newToken, normalizeEmail, sha256 } from "@/lib/crypto";
import { sendVoteConfirmation } from "@/lib/email";
import { roundPhase } from "@/lib/rounds";
import type { Goal, Round } from "@/lib/types";

export type VoteState = { status: "idle" | "ok" | "error"; message?: string };

const MAX_PER_IP_PER_HOUR = 15;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function submitVote(_prev: VoteState, form: FormData): Promise<VoteState> {
  // Honeypot: bots vullen dit verborgen veld in
  if (form.get("website")) return { status: "ok" };

  const goalId = String(form.get("goalId") ?? "");
  const rawEmail = String(form.get("email") ?? "");
  if (!isValidEmail(rawEmail.trim())) {
    return { status: "error", message: "Vul een geldig e-mailadres in." };
  }
  const email = normalizeEmail(rawEmail);

  const db = createServiceClient();
  const { data: goal } = await db
    .from("goals")
    .select("*, rounds(*)")
    .eq("id", goalId)
    .single<Goal & { rounds: Round }>();
  if (!goal || roundPhase(goal.rounds) !== "open") {
    return { status: "error", message: "Stemmen is voor deze ronde niet (meer) mogelijk." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = sha256(ip + (process.env.VOTE_SALT ?? ""));

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) {
    return { status: "error", message: "Te veel stemmen vanaf dit netwerk. Probeer het later opnieuw." };
  }

  const { data: existing } = await db
    .from("votes")
    .select("id, confirmed_at")
    .eq("round_id", goal.round_id)
    .eq("email", email)
    .maybeSingle();
  if (existing?.confirmed_at) {
    return { status: "error", message: "Met dit e-mailadres is deze maand al gestemd." };
  }

  const token = newToken();
  const row = {
    round_id: goal.round_id,
    goal_id: goal.id,
    email,
    token_hash: sha256(token),
    ip_hash: ipHash,
    created_at: new Date().toISOString(),
  };
  const { error } = existing
    ? await db.from("votes").update(row).eq("id", existing.id).is("confirmed_at", null)
    : await db.from("votes").insert(row);
  if (error) {
    console.error(error);
    return { status: "error", message: "Er ging iets mis. Probeer het opnieuw." };
  }

  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/stem/bevestig?token=${token}`;
  try {
    await sendVoteConfirmation({
      to: rawEmail.trim(),
      confirmUrl,
      playerName: goal.player_name,
      roundTitle: goal.rounds.title,
    });
  } catch {
    return { status: "error", message: "We konden de bevestigingsmail niet versturen. Probeer het later opnieuw." };
  }

  return {
    status: "ok",
    message: "Check je mail! Klik op de link om je stem te bevestigen. Kijk ook even in je spam.",
  };
}

export type ConfirmState = { status: "idle" | "ok" | "error"; message?: string };

export async function confirmVote(_prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const token = String(form.get("token") ?? "");
  if (!token) return { status: "error", message: "Ongeldige link." };

  const db = createServiceClient();
  const { data: vote } = await db
    .from("votes")
    .select("id, confirmed_at, created_at, rounds(*)")
    .eq("token_hash", sha256(token))
    .maybeSingle<{ id: string; confirmed_at: string | null; created_at: string; rounds: Round }>();

  if (!vote) return { status: "error", message: "Deze link is ongeldig of al vervangen door een nieuwere stem." };
  if (vote.confirmed_at) return { status: "ok", message: "Je stem was al bevestigd. Bedankt!" };
  if (Date.now() - new Date(vote.created_at).getTime() > TOKEN_TTL_MS) {
    return { status: "error", message: "Deze link is verlopen. Stem opnieuw om een nieuwe link te krijgen." };
  }
  if (roundPhase(vote.rounds) !== "open") {
    return { status: "error", message: "De stemming voor deze ronde is gesloten." };
  }

  const { error } = await db
    .from("votes")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", vote.id)
    .is("confirmed_at", null);
  if (error) return { status: "error", message: "Er ging iets mis. Probeer het opnieuw." };

  return { status: "ok", message: "Je stem is bevestigd. Bedankt voor het stemmen! 🙌" };
}
