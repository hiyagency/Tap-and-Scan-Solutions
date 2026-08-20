"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Camera, LoaderCircle, Upload } from "lucide-react";
import { createShipmentAction } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button button-dark" type="submit" disabled={pending}>{pending ? <><LoaderCircle size={17} /> Publishing…</> : "Upload shipment"}</button>;
}

async function compressForUpload(file: File) {
  if (file.size <= 1.5 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the photo.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error("This browser could not compress the photo.");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "shipment"}.webp`, { type: "image/webp" });
}

export function ShipmentUploadForm() {
  const [photoStatus, setPhotoStatus] = useState("Use camera on mobile or choose a file · optimized automatically");
  const [preparing, setPreparing] = useState(false);

  return (
    <section className="admin-panel shipment-upload-panel">
      <div className="panel-title"><div><p className="eyebrow">New shipment</p><h2>Publish today’s build</h2></div><Camera size={24} /></div>
      <form action={createShipmentAction} className="admin-form shipment-form">
        <label className="shipment-file full-admin-field">
          <span><Upload size={18} /> Product photo</span>
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            capture="environment"
            required
            disabled={preparing}
            onChange={async (event) => {
              const input = event.currentTarget;
              const selected = input.files?.[0];
              if (!selected) return;
              setPreparing(true);
              setPhotoStatus("Optimizing photo for a fast upload…");
              try {
                const prepared = await compressForUpload(selected);
                const transfer = new DataTransfer();
                transfer.items.add(prepared);
                input.files = transfer.files;
                setPhotoStatus(`${prepared.name} · ${(prepared.size / 1024 / 1024).toFixed(1)} MB · ready`);
              } catch (error) {
                input.value = "";
                setPhotoStatus(error instanceof Error ? error.message : "Choose the photo again.");
              } finally {
                setPreparing(false);
              }
            }}
          />
          <small aria-live="polite">{photoStatus}</small>
        </label>
        <label>Product title<input name="title" placeholder="Custom NFC review stand" required minLength={2} maxLength={120} /></label>
        <label>Business name<input name="business_name" placeholder="Optional" /></label>
        <label>City<input name="city" placeholder="e.g. Bhopal" /></label>
        <label>Shipped on<input name="shipped_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        <label className="full-admin-field">Accessible image description<input name="alt_text" placeholder="Black acrylic QR and NFC stand ready for dispatch" required minLength={5} maxLength={180} /></label>
        <label className="full-admin-field">Caption<textarea name="caption" rows={3} placeholder="Optional build details" /></label>
        <label className="admin-toggle full-admin-field"><input name="published" type="checkbox" defaultChecked /> Show on public website now</label>
        <SubmitButton />
      </form>
    </section>
  );
}
