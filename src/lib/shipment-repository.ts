import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureShipmentBucket } from "@/lib/shipment-storage";

export type StoredShipment = {
  id: string;
  title: string;
  business_name: string | null;
  city: string | null;
  caption: string | null;
  alt_text: string;
  image_path: string;
  shipped_on: string;
  published: boolean;
  sort_order: number;
  created_at: string;
};

const manifestPath = "_data/shipments.json";

export async function readShipmentManifest(admin: SupabaseClient): Promise<StoredShipment[]> {
  await ensureShipmentBucket(admin);
  const { data, error } = await admin.storage.from("shipments").download(manifestPath);
  if (error) {
    const status = "statusCode" in error ? String(error.statusCode) : "";
    if (status === "404" || error.message.toLowerCase().includes("not found")) return [];
    throw error;
  }
  const parsed: unknown = JSON.parse(await data.text());
  if (!Array.isArray(parsed)) throw new Error("Shipment storage index is invalid.");
  return parsed as StoredShipment[];
}

export async function writeShipmentManifest(admin: SupabaseClient, shipments: StoredShipment[]) {
  await ensureShipmentBucket(admin);
  const body = new TextEncoder().encode(JSON.stringify(shipments));
  const { error } = await admin.storage.from("shipments").upload(manifestPath, body, {
    cacheControl: "0",
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw error;
}
