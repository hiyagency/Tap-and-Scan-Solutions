"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { commerceDb } from "@/lib/shop/server";
import { bookShipment as legacyBook, shipmentLabel, tracking as legacyTracking } from "@/lib/shop/ithink";
import { bookShipment as nimbusBook, tracking as nimbusTracking } from "@/lib/shop/nimbuspost";
import { keychains } from "@/lib/shop/keychains";
import { catalogue } from "@/lib/shop/catalogue";
const media = z.string().regex(/^\/shop\/[a-z0-9-]+\.(webp|png|jpg|mp4)$/);
import { shippingSpecSchema } from "@/lib/shop/parcel";
const productSchema = z.object({
  packedWeightGrams: z.number().int().positive().max(30000).optional(),
  shipping: shippingSpecSchema.optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(100),
  platform: z.string().min(1).max(40),
  description: z.string().trim().min(1).max(1500),
  colour: z.string().regex(/^#[a-f0-9]{6}$/i),
  category: z.enum(["Social", "Reviews", "All-in-one", "Keychains"]),
  kind: z.enum(["card", "keychain"]).optional(),
  qr: z.boolean().optional(),
  customLogo: z.boolean().optional(),
  active: z.boolean(),
  specifications: z.string().max(5000),
  materials: z.string().max(5000),
  instructions: z.string().max(5000),
  variants: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        name: z.string().min(1).max(80),
        image: media,
        video: z.union([media, z.literal("")]),
        price_paise: z.number().int().positive().max(100000000).nullable(),
        available: z.boolean(),
      }),
    )
    .min(1)
    .max(20),
});
export async function setProductStock(slug:string,expected:number,stock:number){
 await requireOwner();try{z.string().regex(/^[a-z0-9-]+$/).parse(slug);z.number().int().min(0).max(100000).parse(stock);z.number().int().min(0).parse(expected);
 const {data,error}=await commerceDb().from('shop_products').update({stock,updated_at:new Date().toISOString()}).eq('slug',slug).eq('stock',expected).select('slug').maybeSingle();
 if(error||!data)throw new Error('Stock changed or could not be saved. Refresh before trying again.');
 revalidatePath('/');revalidatePath('/products/'+slug);revalidatePath('/admin/catalogue');return {ok:true};}catch(e){return {error:(e as Error).message};}
}
export async function saveProduct(input: unknown) {
  await requireOwner();
  try {
    const data = productSchema.parse(input);
    const db = commerceDb();
    const { data: saved, error } = await db
      .from("shop_products")
      .update({ data, updated_at: new Date().toISOString() })
      .eq("slug", data.slug)
      .select()
      .maybeSingle();
    if (error)
      throw new Error(
        "Catalogue is not configured yet. Apply the commerce migration and seed first.",
      );
    if (!saved) {
      const index = keychains.findIndex(p => p.slug === data.slug);
      if (index < 0) throw new Error("Product not found. Refresh the catalogue.");
      const { error: insertError } = await db.from("shop_products").insert({
        slug: data.slug, position: catalogue.length + index, data,
      });
      if (insertError) throw new Error("Could not save this product. Refresh and retry.");
    }
    revalidatePath("/");
    revalidatePath("/products/" + data.slug);
    revalidatePath("/admin/catalogue");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
export async function orderOperation(
  id: string,
  operation: string,
  value?: string,
) {
  await requireOwner();
  try {
    z.string().uuid().parse(id);
    const db = commerceDb();
    if (operation === "stage") {
      const { error } = await db.rpc("shop_advance_order", {
        p_id: id,
        p_stage: value,
      });
      if (error)
        throw new Error(
          "This status change is not allowed. Refresh the order.",
        );
    } else if (operation === "book") {
      const { data: o } = await db
        .from("shop_orders")
        .select("*,shop_order_items(*)")
        .eq("id", id)
        .single();
      if (!o || o.cancelled_at || o.stage !== "ready_to_ship" || o.payment_status !== "paid")
        throw new Error("Only paid, ready-to-ship orders can be booked.");
      const { error: lock } = await db
        .from("shop_fulfilments")
        .insert({ order_id: id, booking_status: "booking" });
      if (lock)
        throw new Error(
          "A booking exists or is awaiting review. Check the shipping provider before taking further action.",
        );
      try {
        const booking = o.shipping_provider === "nimbuspost" ? await nimbusBook(o, o.shop_order_items) : {awb: await legacyBook(o, o.shop_order_items), label:null};
        const { error: saveError } = await db
          .from("shop_fulfilments")
          .update({ awb:booking.awb, label_url:booking.label, booking_status: "booked" })
          .eq("order_id", id);
        if (saveError)
          throw new Error(
            "Booking succeeded but could not be saved. Reconcile in the shipping provider dashboard.",
          );
        const { error: stageError } = await db.from("shop_orders").update({ stage: "shipped" }).eq("id", id);
        if (stageError) throw new Error("Booking saved; order status requires reconciliation. Do not book again.");
      } catch (e) {
        await db
          .from("shop_fulfilments")
          .update({
            booking_status: "review",
            error: "Check this order in the shipping provider dashboard before any retry.",
          })
          .eq("order_id", id);
        throw e;
      }
    } else if (operation === "label" || operation === "track") {
      const { data: f } = await db
        .from("shop_fulfilments")
        .select("awb,label_url")
        .eq("order_id", id)
        .single();
      if (!f?.awb) throw new Error("No tracking number available.");
      if (operation === "label") {
        const { data: order } = await db.from("shop_orders").select("shipping_provider").eq("id",id).single();
        const url = order?.shipping_provider === "nimbuspost" ? f.label_url : await shipmentLabel(f.awb);
        if (!url) throw new Error("Download this label from the NimbusPost dashboard.");
        await db
          .from("shop_fulfilments")
          .update({ label_url: url })
          .eq("order_id", id);
      } else {
        const { data: order } = await db.from("shop_orders").select("shipping_provider").eq("id",id).single();
        const result = await (order?.shipping_provider === "nimbuspost" ? nimbusTracking : legacyTracking)(f.awb);
        await db
          .from("shop_fulfilments")
          .update({ tracking: result, checked_at: new Date().toISOString() })
          .eq("order_id", id);
        if (result.status.toLowerCase() === "delivered")
          await db
            .from("shop_orders")
            .update({ stage: "delivered" })
            .eq("id", id)
            .eq("stage", "shipped");
      }
    } else throw new Error("Unknown action.");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/orders/" + id);
    revalidatePath("/account/orders/" + id);
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
export async function recordOrderExpense(
  id: string,
  input: { amount: number; reference: string; category: string },
) {
  await requireOwner();
  try {
    z.string().uuid().parse(id);
    const v = z
      .object({
        amount: z.number().int().positive().max(100000000),
        reference: z.string().trim().min(3).max(100),
        category: z.enum(["order_refund", "order_shipping"]),
      })
      .parse(input);
    const { error } = await commerceDb().rpc("shop_record_expense", {
      p_id: id,
      p_amount: v.amount,
      p_reference: v.category + ":" + v.reference,
      p_category: v.category,
    });
    if (error)
      throw new Error(
        "Could not record expense. Verify the amount and reference.",
      );
    revalidatePath("/admin");
    revalidatePath("/admin/finances");
    revalidatePath("/admin/orders/" + id);
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
