"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner, createLoginClient } from "@/lib/admin-auth";
import { hasPublicSupabaseConfig } from "@/lib/supabase/config";
import { getSiteUrl } from "@/lib/site-url";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  return textValue(formData, key) || null;
}

function toPaise(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount above zero.");
  return Math.round(amount * 100);
}

function mutationError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData) {
  if (!hasPublicSupabaseConfig()) redirect("/admin");
  const email = textValue(formData, "email");
  const password = textValue(formData, "password");
  const supabase = await createLoginClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  redirect("/admin");
}

export async function resetPasswordAction(formData: FormData) {
  if (!hasPublicSupabaseConfig()) redirect("/admin/login?message=Supabase%20is%20not%20connected%20yet");
  const email = textValue(formData, "email");
  const supabase = await createLoginClient();
  const siteUrl = getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/auth/callback?next=/admin/update-password` });
  if (error) redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  redirect("/admin/login?message=Password%20reset%20instructions%20have%20been%20sent");
}

export async function updatePasswordAction(formData: FormData) {
  if (!hasPublicSupabaseConfig()) redirect("/admin/login?error=Supabase%20is%20not%20connected");
  const password = textValue(formData, "password");
  const confirmation = textValue(formData, "confirmation");
  if (password.length < 10) redirect("/admin/update-password?error=Use%20at%20least%2010%20characters");
  if (password !== confirmation) redirect("/admin/update-password?error=Passwords%20do%20not%20match");

  const supabase = await createLoginClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/admin/update-password?error=${encodeURIComponent(error.message)}`);
  await supabase.auth.signOut();
  redirect("/admin/login?message=Password%20updated.%20Sign%20in%20with%20your%20new%20password");
}

export async function logoutAction() {
  const supabase = await requireOwner();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createLeadAction(formData: FormData) {
  const supabase = await requireOwner();
  const payload = {
    source: textValue(formData, "source") || "manual",
    status: textValue(formData, "status") || "new",
    name: textValue(formData, "name"),
    business_name: textValue(formData, "business_name"),
    phone: textValue(formData, "phone"),
    email: optionalText(formData, "email"),
    city: optionalText(formData, "city"),
    business_type: optionalText(formData, "business_type"),
    interests: formData.getAll("interests").filter((item): item is string => typeof item === "string"),
    quantity: optionalText(formData, "quantity"),
    timeline: optionalText(formData, "timeline"),
    notes: optionalText(formData, "notes"),
  };
  if (!payload.name || !payload.business_name || !payload.phone) mutationError("/admin/leads", "Name, business and phone are required.");
  const { error } = await supabase.from("leads").insert(payload);
  if (error) mutationError("/admin/leads", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  redirect("/admin/leads?message=Lead%20added");
}

export async function updateLeadAction(formData: FormData) {
  const supabase = await requireOwner();
  const id = textValue(formData, "id");
  const status = textValue(formData, "status");
  const notes = optionalText(formData, "notes");
  const { error } = await supabase.from("leads").update({ status, notes }).eq("id", id);
  if (error) mutationError("/admin/leads", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
}

export async function convertLeadAction(formData: FormData) {
  const supabase = await requireOwner();
  const id = textValue(formData, "id");
  const { data: lead, error: readError } = await supabase.from("leads").select("*").eq("id", id).single();
  if (readError || !lead) mutationError("/admin/leads", readError?.message ?? "Lead not found.");

  const { error: insertError } = await supabase.from("customers").insert({
    source_lead_id: lead.id,
    name: lead.name,
    business_name: lead.business_name,
    phone: lead.phone,
    email: lead.email,
    city: lead.city,
    notes: lead.notes,
  });
  if (insertError) mutationError("/admin/leads", insertError.message);

  const { error: updateError } = await supabase.from("leads").update({ status: "won" }).eq("id", id);
  if (updateError) mutationError("/admin/leads", updateError.message);
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/customers");
  redirect("/admin/customers?message=Lead%20converted%20to%20customer");
}

export async function createCustomerAction(formData: FormData) {
  const supabase = await requireOwner();
  const payload = {
    name: textValue(formData, "name"),
    business_name: textValue(formData, "business_name"),
    phone: textValue(formData, "phone"),
    email: optionalText(formData, "email"),
    city: optionalText(formData, "city"),
    onboarding_date: textValue(formData, "onboarding_date") || new Date().toISOString().slice(0, 10),
    notes: optionalText(formData, "notes"),
  };
  if (!payload.name || !payload.business_name || !payload.phone) mutationError("/admin/customers", "Name, business and phone are required.");
  const { error } = await supabase.from("customers").insert(payload);
  if (error) mutationError("/admin/customers", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  redirect("/admin/customers?message=Customer%20added");
}

export async function updateCustomerAction(formData: FormData) {
  const supabase = await requireOwner();
  const id = textValue(formData, "id");
  const { error } = await supabase.from("customers").update({
    status: textValue(formData, "status"),
    phone: textValue(formData, "phone"),
    email: optionalText(formData, "email"),
    notes: optionalText(formData, "notes"),
  }).eq("id", id);
  if (error) mutationError("/admin/customers", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
}

export async function createServiceAction(formData: FormData) {
  const supabase = await requireOwner();
  const payload = {
    customer_id: textValue(formData, "customer_id"),
    service_name: textValue(formData, "service_name"),
    billing_model: textValue(formData, "billing_model"),
    agreed_amount_paise: toPaise(textValue(formData, "amount")),
    renewal_date: optionalText(formData, "renewal_date"),
    status: "active",
    notes: optionalText(formData, "notes"),
  };
  if (!payload.customer_id || !payload.service_name) mutationError("/admin/customers", "Customer and service are required.");
  const { error } = await supabase.from("customer_services").insert(payload);
  if (error) mutationError("/admin/customers", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  redirect("/admin/customers?message=Service%20added");
}

export async function createTransactionAction(formData: FormData) {
  const supabase = await requireOwner();
  const payload = {
    type: textValue(formData, "type"),
    category: textValue(formData, "category"),
    amount_paise: toPaise(textValue(formData, "amount")),
    payment_mode: textValue(formData, "payment_mode"),
    occurred_on: textValue(formData, "occurred_on") || new Date().toISOString().slice(0, 10),
    customer_id: optionalText(formData, "customer_id"),
    notes: optionalText(formData, "notes"),
  };
  if (!payload.category) mutationError("/admin/finances", "Category is required.");
  const { error } = await supabase.from("transactions").insert(payload);
  if (error) mutationError("/admin/finances", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/finances");
  redirect("/admin/finances?message=Transaction%20recorded");
}

export async function createDueAction(formData: FormData) {
  const supabase = await requireOwner();
  const payload = {
    customer_id: textValue(formData, "customer_id"),
    reference: textValue(formData, "reference"),
    amount_paise: toPaise(textValue(formData, "amount")),
    issue_date: textValue(formData, "issue_date") || new Date().toISOString().slice(0, 10),
    due_date: textValue(formData, "due_date"),
    notes: optionalText(formData, "notes"),
  };
  if (!payload.customer_id || !payload.reference || !payload.due_date) mutationError("/admin/finances", "Customer, reference and due date are required.");
  const { error } = await supabase.from("dues").insert(payload);
  if (error) mutationError("/admin/finances", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/finances");
  redirect("/admin/finances?message=Due%20created");
}

export async function recordPaymentAction(formData: FormData) {
  const supabase = await requireOwner();
  const { error } = await supabase.rpc("record_due_payment", {
    p_due_id: textValue(formData, "due_id"),
    p_amount_paise: toPaise(textValue(formData, "amount")),
    p_payment_mode: textValue(formData, "payment_mode"),
    p_occurred_on: textValue(formData, "occurred_on") || new Date().toISOString().slice(0, 10),
    p_notes: optionalText(formData, "notes"),
  });
  if (error) mutationError("/admin/finances", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/finances");
  redirect("/admin/finances?message=Payment%20recorded%20and%20cash%20flow%20updated");
}

const allowedShipmentTypes = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"],
]);

export async function createShipmentAction(formData: FormData) {
  const supabase = await requireOwner();
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) mutationError("/admin/shipments", "Choose a product photo.");
  const extension = allowedShipmentTypes.get(image.type);
  if (!extension) mutationError("/admin/shipments", "Upload a JPG, PNG, WebP or AVIF image.");
  if (image.size > 10 * 1024 * 1024) mutationError("/admin/shipments", "Image must be 10 MB or smaller.");

  const title = textValue(formData, "title");
  const altText = textValue(formData, "alt_text");
  if (title.length < 2 || altText.length < 5) mutationError("/admin/shipments", "Add a clear title and image description.");
  const imagePath = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("shipments").upload(imagePath, image, { contentType: image.type, upsert: false });
  if (uploadError) mutationError("/admin/shipments", uploadError.message);

  const { error: insertError } = await supabase.from("shipments").insert({
    title,
    business_name: optionalText(formData, "business_name"),
    city: optionalText(formData, "city"),
    caption: optionalText(formData, "caption"),
    alt_text: altText,
    image_path: imagePath,
    shipped_on: textValue(formData, "shipped_on") || new Date().toISOString().slice(0, 10),
    published: formData.get("published") === "on",
  });
  if (insertError) {
    await supabase.storage.from("shipments").remove([imagePath]);
    mutationError("/admin/shipments", insertError.message);
  }
  revalidatePath("/");
  revalidatePath("/admin/shipments");
  redirect("/admin/shipments?message=Shipment%20published");
}

export async function updateShipmentAction(formData: FormData) {
  const supabase = await requireOwner();
  const id = textValue(formData, "id");
  const { error } = await supabase.from("shipments").update({ published: formData.get("published") === "on" }).eq("id", id);
  if (error) mutationError("/admin/shipments", error.message);
  revalidatePath("/");
  revalidatePath("/admin/shipments");
}

export async function deleteShipmentAction(formData: FormData) {
  const supabase = await requireOwner();
  const id = textValue(formData, "id");
  const { data, error: readError } = await supabase.from("shipments").select("image_path").eq("id", id).single();
  if (readError || !data) mutationError("/admin/shipments", readError?.message ?? "Shipment not found.");
  const { error: deleteError } = await supabase.from("shipments").delete().eq("id", id);
  if (deleteError) mutationError("/admin/shipments", deleteError.message);
  await supabase.storage.from("shipments").remove([data.image_path]);
  revalidatePath("/");
  revalidatePath("/admin/shipments");
  redirect("/admin/shipments?message=Shipment%20removed");
}
