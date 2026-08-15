import { ArrowDownRight, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { createDueAction, createTransactionAction, recordPaymentAction } from "@/app/admin/actions";
import { AdminPageHeader, EmptyState, FlashMessage, StatusPill } from "@/components/admin/ui";
import { calculateFinanceTotals, formatInr, getAdminData, labelize } from "@/lib/admin-data";

type FinancePageProps = { searchParams: Promise<{ month?: string; type?: string; message?: string; error?: string }> };
const paymentModes = ["upi", "bank_transfer", "cash", "card", "other"];

export default async function FinancesPage({ searchParams }: FinancePageProps) {
  const params = await searchParams;
  const data = await getAdminData();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const selectedMonth = params.month ?? currentMonth;
  const totals = calculateFinanceTotals(data.transactions, data.dues, selectedMonth);
  const filteredTransactions = data.transactions.filter((transaction) => transaction.occurred_on.startsWith(selectedMonth) && (!params.type || transaction.type === params.type));
  const openDues = data.dues.filter((due) => !["paid", "cancelled"].includes(due.status));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="admin-main">
      <AdminPageHeader eyebrow="Money control" title="Cash flow and collections, reconciled." copy="Record income and expenses in the ledger. Payments against a due create their linked income transaction atomically, so revenue cannot be counted twice." />
      <FlashMessage message={params.message} error={params.error} />

      <section className="finance-summary" aria-label="Financial summary">
        <article><ArrowUpRight size={20} /><span>Income</span><strong>{formatInr(totals.income)}</strong></article>
        <article><ArrowDownRight size={20} /><span>Expenses</span><strong>{formatInr(totals.expenses)}</strong></article>
        <article><ArrowRight size={20} /><span>Net cash flow</span><strong>{formatInr(totals.net)}</strong></article>
        <article><Plus size={20} /><span>Outstanding</span><strong>{formatInr(totals.outstanding)}</strong></article>
      </section>

      <div className="finance-create-grid">
        <details className="admin-create-panel">
          <summary><Plus size={17} /> Record income or expense</summary>
          <form action={createTransactionAction} className="admin-form admin-form-grid">
            <label>Type<select name="type" defaultValue="expense" disabled={data.demo}><option value="income">Income</option><option value="expense">Expense</option></select></label>
            <label>Amount (₹)<input name="amount" type="number" min="0.01" step="0.01" required disabled={data.demo} /></label>
            <label>Category<input name="category" placeholder="e.g. acrylic material" required disabled={data.demo} /></label>
            <label>Payment mode<select name="payment_mode" defaultValue="upi" disabled={data.demo}>{paymentModes.map((mode) => <option key={mode} value={mode}>{labelize(mode)}</option>)}</select></label>
            <label>Date<input name="occurred_on" type="date" defaultValue={today} disabled={data.demo} /></label>
            <label>Customer<select name="customer_id" defaultValue="" disabled={data.demo}><option value="">Not linked</option>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.business_name}</option>)}</select></label>
            <label className="full-admin-field">Notes<textarea name="notes" rows={2} disabled={data.demo} /></label>
            <button className="button button-dark" type="submit" disabled={data.demo}>Record transaction</button>
          </form>
        </details>

        <details className="admin-create-panel">
          <summary><Plus size={17} /> Create a due</summary>
          <form action={createDueAction} className="admin-form admin-form-grid">
            <label className="full-admin-field">Customer<select name="customer_id" required disabled={data.demo}><option value="">Choose customer</option>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.business_name}</option>)}</select></label>
            <label>Reference<input name="reference" placeholder="TAS-1048" required disabled={data.demo} /></label>
            <label>Amount (₹)<input name="amount" type="number" min="0.01" step="0.01" required disabled={data.demo} /></label>
            <label>Issue date<input name="issue_date" type="date" defaultValue={today} disabled={data.demo} /></label>
            <label>Due date<input name="due_date" type="date" required disabled={data.demo} /></label>
            <label className="full-admin-field">Notes<textarea name="notes" rows={2} disabled={data.demo} /></label>
            <button className="button button-dark" type="submit" disabled={data.demo}>Create due</button>
          </form>
        </details>
      </div>

      <section className="admin-panel finance-ledger">
        <div className="panel-title"><div><p className="eyebrow">Ledger</p><h2>Transactions</h2></div></div>
        <form className="admin-filters" method="get">
          <label>Month<input type="month" name="month" defaultValue={selectedMonth} /></label>
          <label>Type<select name="type" defaultValue={params.type ?? ""}><option value="">Income and expense</option><option value="income">Income</option><option value="expense">Expense</option></select></label>
          <button className="button button-outline" type="submit">Apply filters</button>
        </form>
        {filteredTransactions.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Date</th><th>Category</th><th>Customer</th><th>Mode</th><th>Notes</th><th className="numeric">Amount</th></tr></thead>
              <tbody>{filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td data-label="Date">{new Date(`${transaction.occurred_on}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td data-label="Category"><span className={`transaction-type is-${transaction.type}`}>{transaction.type === "income" ? "+" : "−"}</span>{labelize(transaction.category)}</td>
                  <td data-label="Customer">{transaction.customers?.business_name ?? "—"}</td>
                  <td data-label="Mode">{labelize(transaction.payment_mode)}</td>
                  <td data-label="Notes">{transaction.notes ?? "—"}</td>
                  <td data-label="Amount" className={`numeric transaction-amount is-${transaction.type}`}>{transaction.type === "income" ? "+" : "−"}{formatInr(transaction.amount_paise)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState>No transactions match this period.</EmptyState>}
      </section>

      <section className="admin-panel dues-panel" id="dues">
        <div className="panel-title"><div><p className="eyebrow">Collections</p><h2>Outstanding dues</h2></div><strong>{formatInr(totals.outstanding)} open</strong></div>
        {openDues.length ? (
          <div className="dues-grid">
            {openDues.map((due) => {
              const balance = due.amount_paise - due.paid_amount_paise;
              return (
                <article className="due-card" key={due.id}>
                  <div className="due-card-head"><div><p>{due.reference}</p><h3>{due.customers?.business_name ?? "Customer"}</h3></div><StatusPill value={due.status} /></div>
                  <dl className="due-math"><div><dt>Original</dt><dd>{formatInr(due.amount_paise)}</dd></div><div><dt>Paid</dt><dd>{formatInr(due.paid_amount_paise)}</dd></div><div><dt>Balance</dt><dd>{formatInr(balance)}</dd></div></dl>
                  <p>Due {new Date(`${due.due_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  <form action={recordPaymentAction} className="payment-form">
                    <input type="hidden" name="due_id" value={due.id} />
                    <label>Payment received (₹)<input name="amount" type="number" min="0.01" max={(balance / 100).toFixed(2)} step="0.01" required disabled={data.demo} /></label>
                    <label>Mode<select name="payment_mode" defaultValue="upi" disabled={data.demo}>{paymentModes.map((mode) => <option key={mode} value={mode}>{labelize(mode)}</option>)}</select></label>
                    <label>Date<input name="occurred_on" type="date" defaultValue={today} disabled={data.demo} /></label>
                    <label>Note<input name="notes" placeholder="Optional" disabled={data.demo} /></label>
                    <button className="button button-dark" type="submit" disabled={data.demo}>Record payment</button>
                  </form>
                </article>
              );
            })}
          </div>
        ) : <EmptyState>All dues are settled.</EmptyState>}
      </section>
    </main>
  );
}

