"use server";
import { z } from "zod";
import { getOwnerState, requireOwner } from "@/lib/admin-auth";
// Native Web Push storage adapter. No sender runs until a later explicit activation.
export async function savePushSubscription(input: unknown) {
  const db = await requireOwner(); const { user } = await getOwnerState();
  const parsed = z.object({ endpoint: z.string().url().startsWith("https://").max(2048), keys: z.object({ p256dh: z.string().regex(/^[\w-]+={0,2}$/).max(200), auth: z.string().regex(/^[\w-]+={0,2}$/).max(100) }), deviceName: z.string().max(100).default("") }).safeParse(input);
  if (!parsed.success || !user) return { error: "Invalid subscription." };
  const p = parsed.data;
  const { error } = await db.from("push_subscriptions").upsert({ user_id: user.id, endpoint: p.endpoint, p256dh: p.keys.p256dh, auth: p.keys.auth, device_name: p.deviceName, updated_at: new Date().toISOString() }, { onConflict: "endpoint" });
  return error ? { error: "Unable to save this device." } : { ok: true };
}
export async function removePushSubscription(endpoint: string) {
  const db = await requireOwner(); const { user } = await getOwnerState();
  if (!user || endpoint.length > 2048) return { error: "Invalid subscription." };
  const { error } = await db.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
  return error ? { error: "Unable to remove this device." } : { ok: true };
}
