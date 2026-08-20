import { Camera } from "lucide-react";
import { createShipmentAction } from "@/app/admin/actions";
import { PhotoFileInput } from "@/components/admin/photo-file-input";

export function ShipmentUploadForm() {
  return (
    <section className="admin-panel shipment-upload-panel">
      <div className="panel-title"><div><p className="eyebrow">New shipment</p><h2>Publish today’s build</h2></div><Camera size={24} /></div>
      <form action={createShipmentAction} className="admin-form shipment-form">
        <PhotoFileInput />
        <label>Product title<input name="title" placeholder="Custom NFC review stand" required minLength={2} maxLength={120} /></label>
        <label>Business name<input name="business_name" placeholder="Optional" /></label>
        <label>City<input name="city" placeholder="e.g. Bhopal" /></label>
        <label>Shipped on<input name="shipped_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        <label className="full-admin-field">Accessible image description<input name="alt_text" placeholder="Black acrylic QR and NFC stand ready for dispatch" required minLength={5} maxLength={180} /></label>
        <label className="full-admin-field">Caption<textarea name="caption" rows={3} placeholder="Optional build details" /></label>
        <label className="admin-toggle full-admin-field"><input name="published" type="checkbox" defaultChecked /> Show on public website now</label>
        <button className="button button-dark" type="submit">Upload shipment</button>
      </form>
    </section>
  );
}
