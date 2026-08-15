import "server-only";

import { redirect } from "next/navigation";
import { createClient, createOptionalClient } from "@/lib/supabase/server";

export async function getOwnerState() {
  const supabase = await createOptionalClient();
  if (!supabase) return { demo: true as const, user: null };

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return { demo: false as const, user: null };

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "owner") return { demo: false as const, user: null };

  return { demo: false as const, user, profile };
}

export async function requireOwner() {
  const supabase = await createOptionalClient();
  if (!supabase) throw new Error("Connect Supabase to enable admin mutations.");

  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!profile || profile.role !== "owner") redirect("/admin/login?error=Owner%20access%20is%20required");
  return supabase;
}

export async function createLoginClient() {
  return createClient();
}

