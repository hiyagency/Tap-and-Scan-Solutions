import "server-only";

import { createOptionalClient } from "@/lib/supabase/server";
export { calculateFinanceTotals } from "@/lib/finance";

export type LeadStatus = "new" | "contacted" | "qualified" | "quoted" | "won" | "lost";
export type CustomerStatus = "active" | "inactive" | "archived";
export type BillingModel = "one_time" | "monthly";
export type PaymentMode = "cash" | "upi" | "bank_transfer" | "card" | "other";

export type LeadRow = {
  id: string;
  source: string;
  status: LeadStatus;
  name: string;
  business_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  business_type: string | null;
  interests: string[];
  quantity: string | null;
  timeline: string | null;
  message: string | null;
  notes: string | null;
  created_at: string;
};

export type ServiceRow = {
  id: string;
  customer_id: string;
  service_name: string;
  billing_model: BillingModel;
  agreed_amount_paise: number;
  renewal_date: string | null;
  status: "active" | "paused" | "completed";
};

export type CustomerRow = {
  id: string;
  source_lead_id: string | null;
  status: CustomerStatus;
  name: string;
  business_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  onboarding_date: string;
  notes: string | null;
  customer_services: ServiceRow[];
};

export type DueRow = {
  id: string;
  customer_id: string;
  reference: string;
  amount_paise: number;
  paid_amount_paise: number;
  issue_date: string;
  due_date: string;
  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
  notes: string | null;
  customers: { name: string; business_name: string } | null;
};

export type TransactionRow = {
  id: string;
  type: "income" | "expense";
  category: string;
  amount_paise: number;
  payment_mode: PaymentMode;
  occurred_on: string;
  customer_id: string | null;
  due_id: string | null;
  notes: string | null;
  customers: { name: string; business_name: string } | null;
};

export type AdminData = {
  demo: boolean;
  leads: LeadRow[];
  customers: CustomerRow[];
  dues: DueRow[];
  transactions: TransactionRow[];
};

const today = new Date();
const yyyyMm = today.toISOString().slice(0, 7);

const demoData: AdminData = {
  demo: true,
  leads: [
    {
      id: "demo-lead-1",
      source: "website",
      status: "new",
      name: "Riya Sharma",
      business_name: "Saffron Table Café",
      phone: "+91 98765 43210",
      email: "riya@example.com",
      city: "Indore",
      business_type: "Restaurant / Café",
      interests: ["Menu stand", "Google reviews"],
      quantity: "6–10",
      timeline: "Within 2 weeks",
      message: "Need waterproof table stands for our outdoor seating.",
      notes: null,
      created_at: `${yyyyMm}-14T09:30:00.000Z`,
    },
    {
      id: "demo-lead-2",
      source: "instagram",
      status: "qualified",
      name: "Dev Mehta",
      business_name: "Mehta Dental Studio",
      phone: "+91 99887 76655",
      email: "dev@example.com",
      city: "Bhopal",
      business_type: "Professional services",
      interests: ["NFC cards", "Portfolio"],
      quantity: "2–5",
      timeline: "This month",
      message: null,
      notes: "Asked for black acrylic with gold engraving.",
      created_at: `${yyyyMm}-11T12:15:00.000Z`,
    },
    {
      id: "demo-lead-3",
      source: "referral",
      status: "quoted",
      name: "Kavya Iyer",
      business_name: "Northstar Learning",
      phone: "+91 91234 56789",
      email: null,
      city: "Pune",
      business_type: "Training / Coaching",
      interests: ["Private materials"],
      quantity: "25+",
      timeline: "Next month",
      message: null,
      notes: "Quote shared on WhatsApp.",
      created_at: `${yyyyMm}-06T15:45:00.000Z`,
    },
  ],
  customers: [
    {
      id: "demo-customer-1",
      source_lead_id: null,
      status: "active",
      name: "Arjun Verma",
      business_name: "Grind House Roasters",
      phone: "+91 90000 11111",
      email: "arjun@example.com",
      city: "Indore",
      onboarding_date: `${yyyyMm}-02`,
      notes: "Four table stands delivered.",
      customer_services: [
        {
          id: "demo-service-1",
          customer_id: "demo-customer-1",
          service_name: "Custom NFC + QR table stands",
          billing_model: "one_time",
          agreed_amount_paise: 1280000,
          renewal_date: null,
          status: "completed",
        },
        {
          id: "demo-service-2",
          customer_id: "demo-customer-1",
          service_name: "U2L.AI scan analytics",
          billing_model: "monthly",
          agreed_amount_paise: 249900,
          renewal_date: `${yyyyMm}-28`,
          status: "active",
        },
      ],
    },
    {
      id: "demo-customer-2",
      source_lead_id: null,
      status: "active",
      name: "Neha Kapoor",
      business_name: "Studio Nine Salon",
      phone: "+91 90000 22222",
      email: "neha@example.com",
      city: "Ujjain",
      onboarding_date: `${yyyyMm}-04`,
      notes: null,
      customer_services: [
        {
          id: "demo-service-3",
          customer_id: "demo-customer-2",
          service_name: "Instagram NFC cards",
          billing_model: "one_time",
          agreed_amount_paise: 760000,
          renewal_date: null,
          status: "active",
        },
      ],
    },
  ],
  dues: [
    {
      id: "demo-due-1",
      customer_id: "demo-customer-1",
      reference: "TAS-1042",
      amount_paise: 1280000,
      paid_amount_paise: 800000,
      issue_date: `${yyyyMm}-05`,
      due_date: `${yyyyMm}-24`,
      status: "partial",
      notes: null,
      customers: { name: "Arjun Verma", business_name: "Grind House Roasters" },
    },
    {
      id: "demo-due-2",
      customer_id: "demo-customer-2",
      reference: "TAS-1047",
      amount_paise: 760000,
      paid_amount_paise: 0,
      issue_date: `${yyyyMm}-09`,
      due_date: `${yyyyMm}-30`,
      status: "pending",
      notes: "Balance due after installation.",
      customers: { name: "Neha Kapoor", business_name: "Studio Nine Salon" },
    },
  ],
  transactions: [
    {
      id: "demo-tx-1",
      type: "income",
      category: "customer_payment",
      amount_paise: 800000,
      payment_mode: "upi",
      occurred_on: `${yyyyMm}-10`,
      customer_id: "demo-customer-1",
      due_id: "demo-due-1",
      notes: "Advance payment",
      customers: { name: "Arjun Verma", business_name: "Grind House Roasters" },
    },
    {
      id: "demo-tx-2",
      type: "income",
      category: "monthly_service",
      amount_paise: 249900,
      payment_mode: "bank_transfer",
      occurred_on: `${yyyyMm}-03`,
      customer_id: "demo-customer-1",
      due_id: null,
      notes: "Monthly tracked-QR analytics access",
      customers: { name: "Arjun Verma", business_name: "Grind House Roasters" },
    },
    {
      id: "demo-tx-3",
      type: "expense",
      category: "acrylic_material",
      amount_paise: 186500,
      payment_mode: "upi",
      occurred_on: `${yyyyMm}-08`,
      customer_id: null,
      due_id: null,
      notes: "Material purchase",
      customers: null,
    },
  ],
};

export async function getAdminData(): Promise<AdminData> {
  const supabase = await createOptionalClient();
  if (!supabase) return demoData;

  const [leadsResult, customersResult, duesResult, transactionsResult] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("customers").select("*, customer_services(*)").order("onboarding_date", { ascending: false }),
    supabase.from("dues").select("*, customers(name, business_name)").order("due_date", { ascending: true }),
    supabase.from("transactions").select("*, customers(name, business_name)").order("occurred_on", { ascending: false }),
  ]);

  const firstError = leadsResult.error ?? customersResult.error ?? duesResult.error ?? transactionsResult.error;
  if (firstError) throw new Error(firstError.message);

  return {
    demo: false,
    leads: (leadsResult.data ?? []) as LeadRow[],
    customers: (customersResult.data ?? []) as CustomerRow[],
    dues: (duesResult.data ?? []) as DueRow[],
    transactions: (transactionsResult.data ?? []) as TransactionRow[],
  };
}

export function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

export function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
