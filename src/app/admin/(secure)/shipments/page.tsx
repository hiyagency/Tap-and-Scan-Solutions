import Image from "next/image";
import { Camera, Eye, EyeOff, Trash2, Upload } from "lucide-react";
import { createShipmentAction, deleteShipmentAction, updateShipmentAction } from "@/app/admin/actions";
import { AdminPageHeader, EmptyState, FlashMessage } from "@/components/admin/ui";
import { getAdminShipments } from "@/lib/admin-data";

type PageProps = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function ShipmentsPage({ searchParams }: PageProps) {
  const [params, shipments] = await Promise.all([searchParams, getAdminShipments()]);
  return (
    <main className="admin-page">
      <AdminPageHeader eyebrow="Public proof" title="Products shipped" copy="Take a photo or choose one from your phone. Published items appear on the public website immediately." />
      <FlashMessage message={params.message} error={params.error} />
      <section className="admin-panel shipment-upload-panel">
        <div className="panel-title"><div><p className="eyebrow">New shipment</p><h2>Publish today’s build</h2></div><Camera size={24} /></div>
        <form action={createShipmentAction} className="admin-form shipment-form">
          <label className="shipment-file full-admin-field"><span><Upload size={18} /> Product photo</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" capture="environment" required /><small>Use camera on mobile or choose a file · max 10 MB</small></label>
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

      <section className="admin-panel">
        <div className="panel-title"><div><p className="eyebrow">Archive</p><h2>{shipments.length} shipped product{shipments.length === 1 ? "" : "s"}</h2></div></div>
        {shipments.length ? <div className="shipment-admin-grid">{shipments.map((shipment) => (
          <article className="shipment-admin-card" key={shipment.id}>
            <Image src={shipment.image_url} alt={shipment.alt_text} width={720} height={720} sizes="(max-width: 700px) 100vw, 33vw" />
            <div><small>{new Date(`${shipment.shipped_on}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small><h3>{shipment.title}</h3><p>{[shipment.business_name, shipment.city].filter(Boolean).join(" · ") || "Direct order"}</p></div>
            <div className="shipment-admin-actions">
              <form action={updateShipmentAction}><input type="hidden" name="id" value={shipment.id} /><label><input type="checkbox" name="published" defaultChecked={shipment.published} /> {shipment.published ? <><Eye size={15} /> Public</> : <><EyeOff size={15} /> Hidden</>}</label><button className="text-button" type="submit">Save</button></form>
              <form action={deleteShipmentAction}><input type="hidden" name="id" value={shipment.id} /><button className="danger-button" type="submit"><Trash2 size={15} /> Delete</button></form>
            </div>
          </article>
        ))}</div> : <EmptyState>No shipments yet. Upload the first completed order above.</EmptyState>}
      </section>
    </main>
  );
}
