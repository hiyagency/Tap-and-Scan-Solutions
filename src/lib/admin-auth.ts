import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPublicSupabaseConfig } from "@/lib/supabase/config";

export const OWNER_EMAIL = "hello@hiy.agency";

export async function ensureOwnerProfile(user: User) {
  if (user.email?.toLowerCase() !== OWNER_EMAIL) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.from("profiles").upsert({
    id: user.id,
    email: OWNER_EMAIL,
    full_name: "Abhigyan Pandey",
    role: "owner",
  }, { onConflict: "id" }).select("role, full_name").single();
  if (error) throw new Error(`Owner profile sync failed: ${error.message}`);
  return data;
}

export async function ensureOwnerAccount() {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase server configuration is missing.");
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) throw new Error(usersError.message);
  let user = usersData.users.find((candidate) => candidate.email?.toLowerCase() === OWNER_EMAIL);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({ email: OWNER_EMAIL, email_confirm: true });
    if (error) throw new Error(error.message);
    user = data.user;
  } else if (!user.email_confirmed_at) {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
    if (error) throw new Error(error.message);
    user = data.user;
  }
  await ensureOwnerProfile(user);
  return user;
}

export async function getOwnerState() {
  if (!hasPublicSupabaseConfig()) return { configured: false as const, user: null };
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return { configured: true as const, user: null };

  const { data: existingProfile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  const profile = existingProfile?.role === "owner" ? existingProfile : await ensureOwnerProfile(user);
  if (!profile || profile.role !== "owner") return { configured: true as const, user: null };

  return { configured: true as const, user, profile };
}

export async function requireOwner() {
  if (!hasPublicSupabaseConfig()) redirect("/admin/login?error=Supabase%20configuration%20is%20missing");
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");

  const { data: existingProfile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const profile = existingProfile?.role === "owner" ? existingProfile : await ensureOwnerProfile(data.user);
  if (!profile || profile.role !== "owner") redirect("/admin/login?error=Owner%20access%20is%20required");
  return supabase;
}

export async function createLoginClient() {
  return createClient();
}
