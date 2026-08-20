import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureShipmentBucket(admin: SupabaseClient) {
  const existing = await admin.storage.getBucket("shipments");
  if (existing.data) {
    if (existing.data.public && existing.data.allowed_mime_types?.includes("application/json")) return existing.data;
    const { error } = await admin.storage.updateBucket("shipments", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "application/json"],
    });
    if (error) throw error;
    return existing.data;
  }

  const created = await admin.storage.createBucket("shipments", {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "application/json"],
  });
  if (created.error) {
    const retry = await admin.storage.getBucket("shipments");
    if (retry.error || !retry.data) throw created.error;
    return retry.data;
  }
  const ready = await admin.storage.getBucket("shipments");
  if (ready.error || !ready.data) throw ready.error ?? new Error("Shipment bucket was not available after creation.");
  return ready.data;
}
