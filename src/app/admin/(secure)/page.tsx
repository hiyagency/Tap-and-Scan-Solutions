import Link from "next/link";
import { ArrowRight, CalendarClock, IndianRupee, TrendingDown, TrendingUp, UserRoundCheck, UserRoundPlus, WalletCards } from "lucide-react";
import { AdminPageHeader, StatusPill } from "@/components/admin/ui";
import { calculateFinanceTotals, formatInr, getAdminData, labelize } from "@/lib/admin-data";

export default async function AdminDashboard() {
  const data = await getAdminData();
  const month = new Date().toISOString().slice(0, 7);
  const finance = calculateFinanceTotals(data.transactions, data.dues, month);
  const newLeads = data.leads.filter((lead) => lead.status === "new" && lead.created_at.startsWith(month)).length;
  const resolvedLeads = data.leads.filter((lead) => ["won", "lost"].includes(lead.status));
  const wonLeads = data.leads.filter((lead) => lead.status === "won").length;
  const conversionRate = resolvedLeads.length ? Math.round((wonLeads / resolvedLeads.length) * 100) : 0;
  const activeCustomers = data.customers.filter((customer) => customer.status === "active").length;
  const renewals = data.customers.flatMap((customer) => customer.customer_services)
    .filter((service) => service.billing_model === "monthly" && service.status === "active" && service.renewal_date);
  const cashMax = Math.max(finance.income, finance.expenses, 1);

  const kpis = [
    { label: "New leads", value: String(newLeads), hint: "this month", icon: UserRoundPlus },
    { label: "Conversion rate", value: `${conversionRate}%`, hint: "won / resolved", icon: UserRoundCheck },
    { label: "Active customers", value: String(activeCustomers), hint: "current accounts", icon: WalletCards },
    { label: "Monthly income", value: formatInr(finance.income), hint: "recorded cash-in", icon: TrendingUp },
    { label: "Monthly expenses", value: formatInr(finance.expenses), hint: "recorded cash-out", icon: TrendingDown },
    { label: "Net cash flow", value: formatInr(finance.net), hint: "income − expense", icon: IndianRupee },
    { label: "Outstanding dues", value: formatInr(finance.outstanding), hint: "open balance", icon: CalendarClock },
    { label: "Monthly renewals", value: String(renewals.length), hint: "active services", icon: CalendarClock },
  ];

  return (
    <main className="admin-main">
      <AdminPageHeader eyebrow="Command centre" title="A clean read on the business." copy="Live totals are calculated from leads, customer services, dues and transactions—never entered twice." />

      <section className="kpi-grid" aria-label="Business key performance indicators">
        {kpis.map(({ label, value, hint, icon: Icon }) => (
          <article className="kpi-card" key={label}>
            <Icon size={20} aria-hidden="true" />
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{hint}</small>
          </article>
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="admin-panel cash-panel">
          <div className="panel-title"><div><p className="eyebrow">This month</p><h2>Cash flow</h2></div><Link href="/admin/finances">Open ledger <ArrowRight size={16} /></Link></div>
          <div className="cash-total"><span>Net position</span><strong>{formatInr(finance.net)}</strong></div>
          <div className="cash-bars" aria-label={`Income ${formatInr(finance.income)}, expenses ${formatInr(finance.expenses)}`}>
            <div><span>Income</span><i style={{ width: `${Math.max((finance.income / cashMax) * 100, 4)}%` }} /><strong>{formatInr(finance.income)}</strong></div>
            <div className="expense-bar"><span>Expenses</span><i style={{ width: `${Math.max((finance.expenses / cashMax) * 100, 4)}%` }} /><strong>{formatInr(finance.expenses)}</strong></div>
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-title"><div><p className="eyebrow">Pipeline</p><h2>Latest leads</h2></div><Link href="/admin/leads">Manage <ArrowRight size={16} /></Link></div>
          <div className="compact-list">
            {data.leads.slice(0, 4).map((lead) => (
              <article key={lead.id}>
                <div><strong>{lead.business_name}</strong><span>{lead.name} · {lead.city ?? "City not added"}</span></div>
                <StatusPill value={lead.status} />
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel dashboard-wide">
          <div className="panel-title"><div><p className="eyebrow">Collections</p><h2>Open dues</h2></div><Link href="/admin/finances#dues">See all <ArrowRight size={16} /></Link></div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Reference</th><th>Customer</th><th>Due date</th><th>Status</th><th className="numeric">Balance</th></tr></thead>
              <tbody>
                {data.dues.filter((due) => !["paid", "cancelled"].includes(due.status)).slice(0, 5).map((due) => (
                  <tr key={due.id}>
                    <td data-label="Reference"><strong>{due.reference}</strong></td>
                    <td data-label="Customer">{due.customers?.business_name ?? "—"}</td>
                    <td data-label="Due date">{new Date(`${due.due_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td data-label="Status"><StatusPill value={due.status} /></td>
                    <td data-label="Balance" className="numeric">{formatInr(due.amount_paise - due.paid_amount_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <p className="admin-footnote">Payment modes and categories use consistent values such as {labelize("bank_transfer")} to keep summaries dependable.</p>
    </main>
  );
}

