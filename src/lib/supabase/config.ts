export function hasPublicSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function hasServerSupabaseConfig() {
  return hasPublicSupabaseConfig() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Supabase public configuration is missing.");
  return { url, publishableKey };
}

