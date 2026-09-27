import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { quoteShipping, bookShipment, tracking } from "./nimbuspost";
import { shippingReady, checkoutReady } from "./readiness";

beforeEach(() => {
  vi.stubEnv("NIMBUSPOST_API_KEY", "test-key");
  vi.stubEnv("NIMBUSPOST_API_SECRET", "test-secret");
  vi.stubEnv("NIMBUSPOST_PICKUP_PINCODE", "110001");
  vi.stubEnv("PARCEL_LENGTH_CM", "12");
  vi.stubEnv("PARCEL_WIDTH_CM", "10");
  vi.stubEnv("PARCEL_UNIT_HEIGHT_CM", "2");
  vi.stubEnv("PARCEL_UNIT_WEIGHT_KG", "0.1");
  vi.stubEnv("NIMBUSPOST_COURIER_ID", "");
  vi.stubEnv("COMMERCE_LIVE", "false");
  vi.stubEnv("NIMBUSPOST_VERIFIED", "false");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("NimbusPost v2 integration", () => {
  it("allows quotes with payments closed", () => {
    expect(shippingReady()).toBe(true);
    expect(checkoutReady()).toBe(false);
    vi.stubEnv("NIMBUSPOST_API_KEY", "");
    expect(shippingReady()).toBe(false);
  });
  it("uses secret headers, gram weights and integer paise rates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({success:true,data:{available:[{courierId:"carrier-a",courierName:"Carrier",result:{totalPaise:8500}}]}}));
    vi.stubGlobal("fetch", fetchMock);
    const quote = await quoteShipping("400001", 2, 59800);
    expect(quote.amount).toBe(8500);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api-v2.nimbuspost.com/v2/serviceability");
    expect(options.headers["x-api-secret"]).toBe("test-secret");
    expect(JSON.parse(options.body)).toEqual({
      pickupPincode:"110001",deliveryPincode:"400001",paymentMode:"prepaid",orderValuePaise:70564,
      packages:[{length:12,width:10,height:4,weight:200}],
    });
    expect(JSON.stringify(quote)).not.toContain("test-secret");
  });
  it("rejects unavailable rates and does not retry provider failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({success:true,data:{available:[]}}));
    vi.stubGlobal("fetch", fetchMock);
    await expect(quoteShipping("400001",1,29900)).rejects.toThrow("unavailable");
    fetchMock.mockResolvedValue(Response.json({success:false},{status:429}));
    await expect(quoteShipping("400001",1,29900)).rejects.toThrow("retry later");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("never books when verification is disabled", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(bookShipment({reference:"TEST",total_paise:0,shipping_paise:0,address:{} as never,parcel:{length:1,width:1,height:1,weight:1}},[])).rejects.toThrow("verified");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("maps the documented tracking response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({success:true,data:{orderStatus:"booked",latest:{shipStatus:"delivered"},shipment:{edd:"2026-10-01"}}})));
    expect(await tracking("AWB123")).toMatchObject({status:"delivered",expected:"2026-10-01",scans:[{shipStatus:"delivered"}]});
  });
});
