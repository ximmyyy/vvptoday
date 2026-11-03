"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { amsterdamLocalToISO } from "@/lib/rounds";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/login");
  return supabase;
}

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};

export async function signIn(_prev: string | null, form: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error) return "Onjuist e-mailadres of wachtwoord.";
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createRound(form: FormData) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("rounds")
    .insert({
      title: str(form, "title"),
      starts_at: amsterdamLocalToISO(String(form.get("starts_at"))),
      ends_at: amsterdamLocalToISO(String(form.get("ends_at"))),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/admin/rondes/${data.id}`);
}

export async function updateRound(form: FormData) {
  const supabase = await requireAdmin();
  const id = String(form.get("id"));
  const { error } = await supabase
    .from("rounds")
    .update({
      title: str(form, "title"),
      starts_at: amsterdamLocalToISO(String(form.get("starts_at"))),
      ends_at: amsterdamLocalToISO(String(form.get("ends_at"))),
      published: form.get("published") === "on",
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/rondes/${id}`);
}

export async function deleteRound(form: FormData) {
  const supabase = await requireAdmin();
  const id = String(form.get("id"));
  const { data: goals } = await supabase.from("goals").select("video_path").eq("round_id", id);
  if (goals?.length) await supabase.storage.from("goal-videos").remove(goals.map((g) => g.video_path));
  await supabase.from("rounds").delete().eq("id", id);
  redirect("/admin");
}

export async function addGoal(input: {
  round_id: string;
  player_name: string;
  team: string | null;
  opponent: string | null;
  match_date: string | null;
  description: string | null;
  video_path: string;
}) {
  const supabase = await requireAdmin();
  const { count } = await supabase
    .from("goals")
    .select("id", { count: "exact", head: true })
    .eq("round_id", input.round_id);
  const { error } = await supabase.from("goals").insert({ ...input, sort_order: count ?? 0 });
  if (error) return error.message;
  revalidatePath(`/admin/rondes/${input.round_id}`);
  return null;
}

export async function updateGoal(form: FormData) {
  const supabase = await requireAdmin();
  const id = String(form.get("id"));
  const roundId = String(form.get("round_id"));
  await supabase
    .from("goals")
    .update({
      player_name: str(form, "player_name"),
      team: str(form, "team"),
      opponent: str(form, "opponent"),
      match_date: str(form, "match_date"),
      description: str(form, "description"),
      sort_order: Number(form.get("sort_order") ?? 0),
    })
    .eq("id", id);
  revalidatePath(`/admin/rondes/${roundId}`);
}

export async function deleteGoal(form: FormData) {
  const supabase = await requireAdmin();
  const id = String(form.get("id"));
  const roundId = String(form.get("round_id"));
  const { data: goal } = await supabase.from("goals").select("video_path").eq("id", id).single();
  await supabase.from("goals").delete().eq("id", id);
  if (goal) await supabase.storage.from("goal-videos").remove([goal.video_path]);
  revalidatePath(`/admin/rondes/${roundId}`);
}

export async function setWinner(form: FormData) {
  const supabase = await requireAdmin();
  const roundId = String(form.get("round_id"));
  const goalId = str(form, "goal_id");
  await supabase.from("rounds").update({ winner_goal_id: goalId }).eq("id", roundId);
  revalidatePath(`/admin/rondes/${roundId}`);
  revalidatePath("/");
  revalidatePath("/archief");
}
