import { ArrowRight, Plus, Search } from "lucide-react";
import { createCustomerAction, createServiceAction, updateCustomerAction } from "@/app/admin/actions";
import { AdminPageHeader, EmptyState, FlashMessage, StatusPill } from "@/components/admin/ui";
import { formatInr, getAdminData, labelize } from "@/lib/admin-data";

type CustomersPageProps = { searchParams: Promise<{ q?: string; status?: string; message?: string; error?: string }> };
const customerStatuses = ["active", "inactive", "archived"];

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const data = await getAdminData();
  const query = (params.q ?? "").toLowerCase();
  const filtered = data.customers.filter((customer) => {
    const matchesQuery = !query || [customer.name, customer.business_name, customer.phone, customer.email, customer.city].some((value) => value?.toLowerCase().includes(query));
    return matchesQuery && (!params.status || customer.status === params.status);
  });

  return (
    <main className="admin-main">
      <AdminPageHeader eyebrow="Customer record" title="What each customer owns—and what renews." copy="Keep contact details, purchased products, billing model and service renewal dates connected to a single account." />
      <FlashMessage message={params.message} error={params.error} />

      <div className="admin-create-grid">
        <details className="admin-create-panel">
          <summary><Plus size={17} /> Add a customer</summary>
          <form action={createCustomerAction} className="admin-form admin-form-grid">
            <label>Name<input name="name" required /></label>
            <label>Business<input name="business_name" required /></label>
            <label>Phone<input name="phone" inputMode="tel" required /></label>
            <label>Email<input name="email" type="email" /></label>
            <label>City<input name="city" /></label>
            <label>Onboarding date<input name="onboarding_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
            <label className="full-admin-field">Notes<textarea name="notes" rows={3} /></label>
            <button className="button button-dark" type="submit">Add customer <ArrowRight size={16} /></button>
          </form>
        </details>

        <details className="admin-create-panel">
          <summary><Plus size={17} /> Attach a service</summary>
          <form action={createServiceAction} className="admin-form admin-form-grid">
            <label className="full-admin-field">Customer<select name="customer_id" required><option value="">Choose customer</option>{data.customers.filter((customer) => customer.status !== "archived").map((customer) => <option key={customer.id} value={customer.id}>{customer.business_name} — {customer.name}</option>)}</select></label>
            <label className="full-admin-field">Service<input name="service_name" placeholder="e.g. U2L.AI scan analytics" required /></label>
            <label>Billing model<select name="billing_model" defaultValue="one_time"><option value="one_time">One-time</option><option value="monthly">Monthly</option></select></label>
            <label>Agreed amount (₹)<input name="amount" type="number" min="0.01" step="0.01" required /></label>
            <label>Renewal date<input name="renewal_date" type="date" /></label>
            <label>Notes<input name="notes" /></label>
            <button className="button button-dark" type="submit">Attach service <ArrowRight size={16} /></button>
          </form>
        </details>
      </div>

      <form className="admin-filters" method="get">
        <label><span className="sr-only">Search customers</span><Search size={17} /><input name="q" defaultValue={params.q} placeholder="Search name, business, phone or city" /></label>
        <label><span className="sr-only">Filter customers</span><select name="status" defaultValue={params.status ?? ""}><option value="">All customers</option>{customerStatuses.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}</select></label>
        <button className="button button-outline" type="submit">Apply filters</button>
      </form>

      <div className="admin-result-count"><strong>{filtered.length}</strong> {filtered.length === 1 ? "customer" : "customers"}</div>
      {filtered.length ? (
        <section className="customer-admin-grid" aria-label="Customer records">
          {filtered.map((customer) => (
            <article className="customer-admin-card" key={customer.id}>
              <div className="lead-card-head">
                <div><p>Since {new Date(`${customer.onboarding_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p><h2>{customer.business_name}</h2><span>{customer.name} · {customer.city ?? "City not added"}</span></div>
                <StatusPill value={customer.status} />
              </div>
              <div className="customer-contact"><a href={`tel:${customer.phone}`}>{customer.phone}</a>{customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : null}</div>

              <div className="services-list">
                <p className="eyebrow">Services</p>
                {customer.customer_services.length ? customer.customer_services.map((service) => (
                  <article key={service.id}>
                    <div><strong>{service.service_name}</strong><span>{labelize(service.billing_model)}{service.renewal_date ? ` · renews ${new Date(`${service.renewal_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}</span></div>
                    <div><strong>{formatInr(service.agreed_amount_paise)}</strong><StatusPill value={service.status} /></div>
                  </article>
                )) : <span>No services attached yet.</span>}
              </div>

              <form action={updateCustomerAction} className="record-edit-form customer-edit-form">
                <input type="hidden" name="id" value={customer.id} />
                <label>Status<select name="status" defaultValue={customer.status}>{customerStatuses.map((status) => <option value={status} key={status}>{labelize(status)}</option>)}</select></label>
                <label>Phone<input name="phone" defaultValue={customer.phone} required /></label>
                <label>Email<input name="email" type="email" defaultValue={customer.email ?? ""} /></label>
                <label className="full-admin-field">Notes<textarea name="notes" rows={2} defaultValue={customer.notes ?? ""} /></label>
                <button className="button button-outline" type="submit">Save customer</button>
              </form>
            </article>
          ))}
        </section>
      ) : <EmptyState>No customers match these filters.</EmptyState>}
    </main>
  );
}
