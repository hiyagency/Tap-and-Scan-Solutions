import Image from "next/image";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { deleteShipmentAction, updateShipmentAction } from "@/app/admin/actions";
import { AdminPageHeader, EmptyState, FlashMessage } from "@/components/admin/ui";
import { ShipmentUploadForm } from "@/components/admin/shipment-upload-form";
import { getAdminShipments } from "@/lib/admin-data";

type PageProps = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function ShipmentsPage({ searchParams }: PageProps) {
  const [params, shipments] = await Promise.all([searchParams, getAdminShipments()]);
  return (
    <main className="admin-main admin-page">
      <AdminPageHeader eyebrow="Public proof" title="Products shipped" copy="Take a photo or choose one from your phone. Published items appear on the public website immediately." />
      <FlashMessage message={params.message} error={params.error} />
      <ShipmentUploadForm />

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
