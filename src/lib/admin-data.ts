import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/admin-auth";
import { readShipmentManifest } from "@/lib/shipment-repository";
export { calculateFinanceTotals } from "@/lib/finance";

export type LeadStatus = "new" | "contacted" | "qualified" | "quoted" | "won" | "lost";
export type CustomerStatus = "active" | "inactive" | "archived";
export type BillingModel = "one_time" | "monthly";
export type PaymentMode = "cash" | "upi" | "bank_transfer" | "card" | "other";
export type LeadRow = { id: string; source: string; status: LeadStatus; name: string; business_name: string; phone: string; email: string | null; city: string | null; business_type: string | null; interests: string[]; quantity: string | null; timeline: string | null; message: string | null; notes: string | null; created_at: string };
export type ServiceRow = { id: string; customer_id: string; service_name: string; billing_model: BillingModel; agreed_amount_paise: number; renewal_date: string | null; status: "active" | "paused" | "completed" };
export type CustomerRow = { id: string; source_lead_id: string | null; status: CustomerStatus; name: string; business_name: string; phone: string; email: string | null; city: string | null; onboarding_date: string; notes: string | null; customer_services: ServiceRow[] };
export type DueRow = { id: string; customer_id: string; reference: string; amount_paise: number; paid_amount_paise: number; issue_date: string; due_date: string; status: "pending" | "partial" | "paid" | "overdue" | "cancelled"; notes: string | null; customers: { name: string; business_name: string } | null };
export type TransactionRow = { id: string; type: "income" | "expense"; category: string; amount_paise: number; payment_mode: PaymentMode; occurred_on: string; customer_id: string | null; due_id: string | null; notes: string | null; customers: { name: string; business_name: string } | null };
export type ShipmentRow = { id: string; title: string; business_name: string | null; city: string | null; caption: string | null; alt_text: string; image_path: string; shipped_on: string; published: boolean; sort_order: number; created_at: string; image_url: string };
export type AdminData = { leads: LeadRow[]; customers: CustomerRow[]; dues: DueRow[]; transactions: TransactionRow[] };

async function getAuthorizedAdminClient() {
  await requireOwner();
  const admin = createAdminClient();
  if (!admin) throw new Error("The server database connection is unavailable.");
  return admin;
}

export async function getAdminData(): Promise<AdminData> {
  const supabase = await getAuthorizedAdminClient();
  const [leadsResult, customersResult, duesResult, transactionsResult] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("customers").select("*, customer_services(*)").order("onboarding_date", { ascending: false }),
    supabase.from("dues").select("*, customers(name, business_name)").order("due_date", { ascending: true }),
    supabase.from("transactions").select("*, customers(name, business_name)").order("occurred_on", { ascending: false }),
  ]);
  const firstError = leadsResult.error ?? customersResult.error ?? duesResult.error ?? transactionsResult.error;
  if (firstError) throw new Error(firstError.message);
  return { leads: (leadsResult.data ?? []) as LeadRow[], customers: (customersResult.data ?? []) as CustomerRow[], dues: (duesResult.data ?? []) as DueRow[], transactions: (transactionsResult.data ?? []) as TransactionRow[] };
}

export async function getLeads(): Promise<LeadRow[]> {
  const supabase = await getAuthorizedAdminClient();
  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as LeadRow[];
}

export async function getCustomers(): Promise<CustomerRow[]> {
  const supabase = await getAuthorizedAdminClient();
  const { data, error } = await supabase.from("customers").select("*, customer_services(*)").order("onboarding_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerRow[];
}

export async function getFinanceData(): Promise<Pick<AdminData, "customers" | "dues" | "transactions">> {
  const supabase = await getAuthorizedAdminClient();
  const [customersResult, duesResult, transactionsResult] = await Promise.all([
    supabase.from("customers").select("*, customer_services(*)").order("onboarding_date", { ascending: false }),
    supabase.from("dues").select("*, customers(name, business_name)").order("due_date", { ascending: true }),
    supabase.from("transactions").select("*, customers(name, business_name)").order("occurred_on", { ascending: false }),
  ]);
  const firstError = customersResult.error ?? duesResult.error ?? transactionsResult.error;
  if (firstError) throw new Error(firstError.message);
  return {
    customers: (customersResult.data ?? []) as CustomerRow[],
    dues: (duesResult.data ?? []) as DueRow[],
    transactions: (transactionsResult.data ?? []) as TransactionRow[],
  };
}

function withShipmentUrl<T extends Omit<ShipmentRow, "image_url">>(shipment: T, baseUrl: string): ShipmentRow {
  return { ...shipment, image_url: `${baseUrl}/storage/v1/object/public/shipments/${shipment.image_path}` };
}

export async function getAdminShipments(): Promise<ShipmentRow[]> {
  const supabase = await getAuthorizedAdminClient();
  const data = await readShipmentManifest(supabase);
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return data.sort((a, b) => b.shipped_on.localeCompare(a.shipped_on) || b.sort_order - a.sort_order).map((row) => withShipmentUrl(row, baseUrl));
}

export async function getPublishedShipments(): Promise<ShipmentRow[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];
  try {
    const data = await readShipmentManifest(supabase);
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return data.filter((row) => row.published).sort((a, b) => b.shipped_on.localeCompare(a.shipped_on) || b.sort_order - a.sort_order).slice(0, 12).map((row) => withShipmentUrl(row, baseUrl));
  } catch { return []; }
}

export function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: paise % 100 === 0 ? 0 : 2 }).format(paise / 100);
}
export function labelize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
