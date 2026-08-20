import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPublicSupabaseConfig } from "@/lib/supabase/config";

export const OWNER_EMAIL = "hello@hiy.agency";

const getVerifiedOwner = cache(async () => {
  if (!hasPublicSupabaseConfig()) return { configured: false as const, user: null, supabase: null };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email.toLowerCase() : null;
  const subject = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (error || email !== OWNER_EMAIL || !subject) return { configured: true as const, user: null, supabase };
  return { configured: true as const, user: { id: subject, email }, supabase };
});

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
  const state = await getVerifiedOwner();
  if (!state.configured || !state.user) return { configured: state.configured, user: null };
  return { configured: true as const, user: state.user, profile: { role: "owner", full_name: "Abhigyan Pandey" } };
}

export async function requireOwner() {
  const state = await getVerifiedOwner();
  if (!state.configured) redirect("/admin/login?error=Supabase%20configuration%20is%20missing");
  if (!state.user || !state.supabase) redirect("/admin/login");
  return state.supabase;
}

export async function createLoginClient() {
  return createClient();
}
