import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPublicSupabaseConfig } from "@/lib/supabase/config";

export async function getOwnerState() {
  if (!hasPublicSupabaseConfig()) return { configured: false as const, user: null };
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return { configured: true as const, user: null };

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "owner") return { configured: true as const, user: null };

  return { configured: true as const, user, profile };
}

export async function requireOwner() {
  if (!hasPublicSupabaseConfig()) redirect("/admin/login?error=Supabase%20configuration%20is%20missing");
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!profile || profile.role !== "owner") redirect("/admin/login?error=Owner%20access%20is%20required");
  return supabase;
}

export async function createLoginClient() {
  return createClient();
}
