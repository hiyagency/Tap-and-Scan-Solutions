import { ArrowRight, Plus, Search } from "lucide-react";
import { convertLeadAction, createLeadAction, updateLeadAction } from "@/app/admin/actions";
import { AdminPageHeader, EmptyState, FlashMessage, StatusPill } from "@/components/admin/ui";
import { getLeads, labelize } from "@/lib/admin-data";

type LeadsPageProps = { searchParams: Promise<{ q?: string; status?: string; message?: string; error?: string }> };

const statuses = ["new", "contacted", "qualified", "quoted", "won", "lost"];
const interestOptions = ["Smart QR", "Waterproof product", "NFC tags or cards", "Acrylic stand", "Google reviews", "Instagram", "Private materials", "Custom solution"];

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const leads = await getLeads();
  const query = (params.q ?? "").toLowerCase();
  const filtered = leads.filter((lead) => {
    const matchesQuery = !query || [lead.name, lead.business_name, lead.phone, lead.email, lead.city].some((value) => value?.toLowerCase().includes(query));
    return matchesQuery && (!params.status || lead.status === params.status);
  });

  return (
    <main className="admin-main">
      <AdminPageHeader eyebrow="Enquiry pipeline" title="Every lead, with a next step." copy="Capture enquiries from the website or add conversations manually, then move them through one consistent pipeline." />
      <FlashMessage message={params.message} error={params.error} />

      <details className="admin-create-panel" open={leads.length === 0}>
        <summary><Plus size={17} /> Add a lead manually</summary>
        <form action={createLeadAction} className="admin-form admin-form-grid">
          <label>Name<input name="name" required /></label>
          <label>Business<input name="business_name" required /></label>
          <label>Phone / WhatsApp<input name="phone" inputMode="tel" required /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>City<input name="city" /></label>
          <label>Business type<input name="business_type" /></label>
          <label>Source<select name="source" defaultValue="manual"><option value="manual">Manual</option><option value="referral">Referral</option><option value="instagram">Instagram</option><option value="phone">Phone</option><option value="website">Website</option></select></label>
          <label>Timeline<input name="timeline" placeholder="e.g. Within 2 weeks" /></label>
          <fieldset className="admin-checks full-admin-field"><legend>Interested in</legend>{interestOptions.map((option) => <label key={option}><input type="checkbox" name="interests" value={option} /> {option}</label>)}</fieldset>
          <label className="full-admin-field">Notes<textarea name="notes" rows={3} /></label>
          <button className="button button-dark" type="submit">Add lead <ArrowRight size={16} /></button>
        </form>
      </details>

      <form className="admin-filters" method="get">
        <label><span className="sr-only">Search leads</span><Search size={17} aria-hidden="true" /><input name="q" defaultValue={params.q} placeholder="Search name, business, phone or city" /></label>
        <label><span className="sr-only">Filter by status</span><select name="status" defaultValue={params.status ?? ""}><option value="">All statuses</option>{statuses.map((status) => <option value={status} key={status}>{labelize(status)}</option>)}</select></label>
        <button className="button button-outline" type="submit">Apply filters</button>
      </form>

      <div className="admin-result-count"><strong>{filtered.length}</strong> {filtered.length === 1 ? "lead" : "leads"}</div>
      {filtered.length ? (
        <section className="lead-admin-grid" aria-label="Lead records">
          {filtered.map((lead) => (
            <article className="lead-admin-card" key={lead.id}>
              <div className="lead-card-head">
                <div><p>{lead.source}</p><h2>{lead.business_name}</h2><span>{lead.name}</span></div>
                <StatusPill value={lead.status} />
              </div>
              <dl className="record-details">
                <div><dt>Phone</dt><dd><a href={`tel:${lead.phone}`}>{lead.phone}</a></dd></div>
                <div><dt>Email</dt><dd>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : "—"}</dd></div>
                <div><dt>Location</dt><dd>{[lead.city, lead.business_type].filter(Boolean).join(" · ") || "—"}</dd></div>
                <div><dt>Timeline</dt><dd>{lead.timeline ?? "—"}</dd></div>
              </dl>
              {lead.interests.length ? <div className="tag-row">{lead.interests.map((interest) => <span key={interest}>{interest}</span>)}</div> : null}
              {lead.message ? <blockquote>“{lead.message}”</blockquote> : null}
              <form action={updateLeadAction} className="record-edit-form">
                <input type="hidden" name="id" value={lead.id} />
                <label>Status<select name="status" defaultValue={lead.status}>{statuses.map((status) => <option value={status} key={status}>{labelize(status)}</option>)}</select></label>
                <label>Internal notes<textarea name="notes" rows={2} defaultValue={lead.notes ?? ""} /></label>
                <button className="button button-outline" type="submit">Save update</button>
              </form>
              {lead.status !== "won" ? (
                <form action={convertLeadAction} className="convert-form">
                  <input type="hidden" name="id" value={lead.id} />
                  <button className="text-button" type="submit">Convert to customer <ArrowRight size={15} /></button>
                </form>
              ) : null}
            </article>
          ))}
        </section>
      ) : <EmptyState>No leads match these filters.</EmptyState>}
    </main>
  );
}
