"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { getOrderSummary } from "@/lib/admin-orders";

export async function orderSummaryAction() { return getOrderSummary(); }
export async function adminOrderAction(input: unknown) {
  const db = await requireOwner();
  const parsed = z.object({ id: z.string().uuid(), expected: z.string().datetime({ offset: true }).nullable(), action: z.enum(["read", "note", "confirm", "process", "pack", "deliver", "cancel"]), value: z.string().trim().max(5000).default("") }).safeParse(input);
  if (!parsed.success) return { error: "Check the order details and try again." };
  const p = parsed.data;
  const { error } = await db.rpc("admin_order_action", { p_id: p.id, p_expected: p.expected, p_action: p.action, p_value: p.value });
  if (error) { console.error("[admin-orders] action rejected", error.code); return { error: "The order changed or this action is not allowed. Refresh and try again." }; }
  if (p.action !== "read") {
    revalidatePath("/admin"); revalidatePath("/admin/orders"); revalidatePath("/admin/orders/" + p.id); revalidatePath("/account/orders/" + p.id);
  }
  return { ok: true };
}
