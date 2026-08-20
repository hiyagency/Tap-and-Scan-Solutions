"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

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

export function PhotoFileInput() {
  const [status, setStatus] = useState("Use camera on mobile or choose a file · optimized automatically");
  const [preparing, setPreparing] = useState(false);
  return (
    <label className="shipment-file full-admin-field">
      <span><Upload size={18} /> Product photo</span>
      <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" capture="environment" required disabled={preparing} onChange={async (event) => {
        const input = event.currentTarget;
        const selected = input.files?.[0];
        if (!selected) return;
        setPreparing(true);
        setStatus("Optimizing photo for a fast upload…");
        try {
          const prepared = await compressForUpload(selected);
          const transfer = new DataTransfer();
          transfer.items.add(prepared);
          input.files = transfer.files;
          setStatus(`${prepared.name} · ${(prepared.size / 1024 / 1024).toFixed(1)} MB · ready`);
        } catch (error) {
          input.value = "";
          setStatus(error instanceof Error ? error.message : "Choose the photo again.");
        } finally { setPreparing(false); }
      }} />
      <small aria-live="polite">{status}</small>
    </label>
  );
}
