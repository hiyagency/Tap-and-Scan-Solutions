import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock("./server", () => ({ commerceDb: () => state }));
import { prepareRazorpayCheckout, processRazorpayWebhook, reconcileRazorpayOrder, verifyRazorpayCheckout } from "./razorpay";

const order = {
  id: "00000000-0000-4000-8000-000000000001", user_id: "buyer", total_paise: 40282,
  reference: "NFC-TEST", email: "buyer@example.test", address: { name: "Buyer", phone: "9999999999" },
  payment_status: "pending", cancelled_at: null,
};
const record = { order_id: order.id, provider: "razorpay", razorpay_order_id: "order_Example123", status: "ready", provider_id: null };
const payment = { id: "pay_Example123", order_id: record.razorpay_order_id, amount: order.total_paise, currency: "INR", status: "captured", captured: true };
function query(data: unknown, error: unknown = null) {
  const chain = { select: vi.fn(), eq: vi.fn(), is: vi.fn(), update: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() };
  chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.is.mockReturnValue(chain); chain.update.mockReturnValue(chain);
  chain.single.mockResolvedValue({ data, error }); chain.maybeSingle.mockResolvedValue({ data, error });
  return chain;
}
beforeEach(() => {
  state.from.mockReset(); state.rpc.mockReset();
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_live_UnitTest"); vi.stubEnv("RAZORPAY_KEY_SECRET", "unit-test-only-secret");
  vi.stubEnv("RAZORPAY_ENV", "production"); vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook-test-only-secret");
  state.from.mockImplementation((table: string) => query(table === "shop_payments" ? record : order));
  state.rpc.mockResolvedValue({ data: order.id, error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Razorpay server orchestration", () => {
  it("reuses an existing provider order without creating another or leaking secrets", async () => {
    state.rpc.mockResolvedValueOnce({ data: { action: "reuse", razorpay_order_id: record.razorpay_order_id }, error: null });
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const result = await prepareRazorpayCheckout(order);
    expect(result).toMatchObject({ provider: "razorpay", orderId: order.id, razorpayOrderId: record.razorpay_order_id, amount: order.total_paise });
    expect(JSON.stringify(result)).not.toContain("secret"); expect(fetcher).not.toHaveBeenCalled();
  });
  it("creates exact server totals and persists the provider order before returning it", async () => {
    state.rpc.mockResolvedValueOnce({ data: { action: "create" }, error: null });
    const fetcher = vi.fn().mockResolvedValue(Response.json({ id: record.razorpay_order_id, amount: order.total_paise, currency: "INR", receipt: order.id, status: "created" }));
    vi.stubGlobal("fetch", fetcher);
    await prepareRazorpayCheckout(order);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({ amount: order.total_paise, receipt: order.id, partial_payment: false });
    expect(state.rpc).toHaveBeenLastCalledWith("shop_attach_razorpay_order", { p_id: order.id, p_provider_order: record.razorpay_order_id, p_amount: order.total_paise });
  });
  it("recovers uncertain creates by receipt and never blindly creates twice", async () => {
    state.rpc.mockResolvedValueOnce({ data: { action: "recover" }, error: null });
    const fetcher = vi.fn().mockResolvedValue(Response.json({ items: [{ id: record.razorpay_order_id, amount: order.total_paise, currency: "INR", receipt: order.id }] }));
    vi.stubGlobal("fetch", fetcher);
    await prepareRazorpayCheckout(order);
    expect(fetcher.mock.calls[0][0]).toContain("orders?receipt="); expect(fetcher.mock.calls[0][1].method).toBe("GET");
  });
  it("does not call the provider while another request holds the creation claim", async () => {
    state.rpc.mockResolvedValueOnce({ data: { action: "busy" }, error: null });
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(prepareRazorpayCheckout(order)).rejects.toThrow("being prepared"); expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not send test keys into real stock and finance records", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_UnitTest");
    await expect(prepareRazorpayCheckout(order)).rejects.toThrow("Live payments"); expect(state.rpc).not.toHaveBeenCalled();
  });
  it("leaves authorized payments pending with no income transaction", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ...payment, status: "authorized", captured: false })));
    const result = await reconcileRazorpayOrder(order.id, payment.id);
    expect(result.paid).toBe(false); expect(state.rpc).not.toHaveBeenCalled();
  });
  it("passes captured verification to the atomic idempotent ledger RPC", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payment)));
    const result = await reconcileRazorpayOrder(order.id, payment.id, "evt_1");
    expect(result.paid).toBe(true);
    expect(state.rpc).toHaveBeenCalledWith("shop_confirm_razorpay_payment", { p_id: order.id, p_provider_order: record.razorpay_order_id, p_provider_payment: payment.id, p_amount: order.total_paise, p_event_id: "evt_1" });
  });
  it("rejects mismatched amounts before touching the finance ledger", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ...payment, amount: 1 })));
    await expect(reconcileRazorpayOrder(order.id, payment.id)).rejects.toThrow("does not match"); expect(state.rpc).not.toHaveBeenCalled();
  });
  it("treats already verified refunded payments as resolved without another provider charge", async () => {
    state.from.mockImplementation((table: string) => query(table === "shop_payments" ? { ...record, status: "paid", provider_id: payment.id } : { ...order, payment_status: "refunded" }));
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect(await reconcileRazorpayOrder(order.id, payment.id)).toMatchObject({ paid: true, paymentStatus: "refunded" });
    expect(fetcher).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
  });
  it("rejects a second payment reference after verified settlement", async () => {
    state.from.mockImplementation((table: string) => query(table === "shop_payments" ? { ...record, status: "paid", provider_id: payment.id } : { ...order, payment_status: "paid" }));
    await expect(reconcileRazorpayOrder(order.id, "pay_Another")).rejects.toThrow("Another payment needs reconciliation");
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("rejects another customer's order before signature or provider verification", async () => {
    state.from.mockReturnValue(query(null));
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(verifyRazorpayCheckout("other-buyer", { orderId: order.id, razorpay_order_id: record.razorpay_order_id, razorpay_payment_id: payment.id, razorpay_signature: "0".repeat(64) })).rejects.toThrow("Order not found");
    expect(fetcher).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
  });
  it("rejects forged callbacks and webhooks without provider calls", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(verifyRazorpayCheckout(order.user_id, { orderId: order.id, razorpay_order_id: record.razorpay_order_id, razorpay_payment_id: payment.id, razorpay_signature: "0".repeat(64) })).rejects.toThrow("Invalid payment signature");
    await expect(processRazorpayWebhook("{}", "0".repeat(64), "evt_1")).rejects.toThrow("Invalid webhook signature");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("verifies signed captured webhooks against the provider and propagates the event ID", async () => {
    const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: payment } } });
    const signature = createHmac("sha256", "webhook-test-only-secret").update(raw).digest("hex");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payment)));
    await processRazorpayWebhook(raw, signature, "evt_duplicate_safe");
    expect(state.rpc).toHaveBeenLastCalledWith("shop_confirm_razorpay_payment", expect.objectContaining({ p_event_id: "evt_duplicate_safe" }));
  });
  it("ignores failed/authorized events without downgrading captured payments", async () => {
    const raw = JSON.stringify({ event: "payment.failed", payload: { payment: { entity: payment } } });
    const signature = createHmac("sha256", "webhook-test-only-secret").update(raw).digest("hex");
    await processRazorpayWebhook(raw, signature, "evt_failed");
    expect(state.from).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
  });
});
