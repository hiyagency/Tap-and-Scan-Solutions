import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { quoteShipping, bookShipment, tracking, selectRate } from "./nimbuspost";
import { shippingReady, checkoutReady } from "./readiness";
import type { Address } from "./validation";

const cardParcel={length:9.2,width:6.2,height:1.4,weight:0.25};
const address:Address={name:"Test Customer",phone:"9876543210",line1:"12 Test Road",line2:"",city:"Mumbai",state:"Maharashtra",pincode:"400001",country:"India"};
const order={reference:"NFC-TEST",total_paise:41229,shipping_paise:5947,address,parcel:{...cardParcel,courier_id:"carrier-a"}};
const items=[{name:"Google Review Card",variant_id:"google-reviews",quantity:1,price_paise:29900}];

beforeEach(() => {
  vi.stubEnv("NIMBUSPOST_API_KEY", "test-key");
  vi.stubEnv("NIMBUSPOST_API_SECRET", "test-secret");
  vi.stubEnv("NIMBUSPOST_PICKUP_PINCODE", "484001");
  vi.stubEnv("NIMBUSPOST_WAREHOUSE_ID", "");
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
    const quote = await quoteShipping("400001", 2, 59800,{...cardParcel,height:2.8,weight:0.5});
    expect(quote.amount).toBe(8500);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api-v2.nimbuspost.com/v2/serviceability");
    expect(options.headers["x-api-secret"]).toBe("test-secret");
    expect(JSON.parse(options.body)).toEqual({
      pickupPincode:"484001",deliveryPincode:"400001",paymentMode:"prepaid",orderValuePaise:70564,
      packages:[{length:9.2,width:6.2,height:2.8,weight:500}],
    });
    expect(JSON.stringify(quote)).not.toContain("test-secret");
  });
  it("rejects unavailable rates and does not retry provider failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({success:true,data:{available:[]}}));
    vi.stubGlobal("fetch", fetchMock);
    await expect(quoteShipping("400001",1,29900,cardParcel)).rejects.toThrow("unavailable");
    fetchMock.mockResolvedValue(Response.json({success:false},{status:429}));
    await expect(quoteShipping("400001",1,29900,cardParcel)).rejects.toThrow("retry later");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("never books when verification is disabled", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(bookShipment({reference:"TEST",total_paise:0,shipping_paise:0,address:{} as never,parcel:{length:1,width:1,height:1,weight:1}},[])).rejects.toThrow("verified");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("requires real packed dimensions and valid order inputs before contacting NimbusPost", async()=>{
    const fetchMock=vi.fn();vi.stubGlobal("fetch",fetchMock);
    await expect(quoteShipping("400001",1,29900,undefined as never)).rejects.toThrow("Packed shipping measurements");
    await expect(quoteShipping("400001",1,29900,{...cardParcel,weight:NaN})).rejects.toThrow("measurements");
    await expect(quoteShipping("000000",1,29900,cardParcel)).rejects.toThrow("PIN");
    await expect(quoteShipping("400001",1,0,cardParcel)).rejects.toThrow("subtotal");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("selects the cheapest valid rate and honors a fixed courier without falling back",()=>{
    const rates=[{courierId:"a",courierName:"A",tatDays:8,result:{totalPaise:5947}},{courierId:"b",courierName:"B",result:{totalPaise:10408}}];
    expect(selectRate(rates)).toMatchObject({amount:5947,courierId:"a",deliveryDays:8});
    expect(selectRate(rates,"b")).toMatchObject({amount:10408,courierId:"b"});
    expect(()=>selectRate(rates,"missing")).toThrow("unavailable");
    expect(()=>selectRate([{...rates[0],result:{totalPaise:0}}])).toThrow("unavailable");
  });
  it("maps authentication, rate limits, malformed envelopes and timeouts to safe failures",async()=>{
    const fetchMock=vi.fn();vi.stubGlobal("fetch",fetchMock);
    fetchMock.mockResolvedValueOnce(Response.json({success:false,error:{code:"UNAUTHORIZED",detail:"test-secret"}},{status:401}));
    await expect(quoteShipping("400001",1,29900,cardParcel)).rejects.toThrow("authentication needs attention");
    fetchMock.mockResolvedValueOnce(new Response("not JSON",{status:200}));
    await expect(quoteShipping("400001",1,29900,cardParcel)).rejects.toThrow("retry later");
    fetchMock.mockResolvedValueOnce(Response.json({success:true,data:null}));
    await expect(quoteShipping("400001",1,29900,cardParcel)).rejects.toThrow("Invalid NimbusPost quote");
    fetchMock.mockRejectedValueOnce(new DOMException("Secret URL","TimeoutError"));
    await expect(quoteShipping("400001",1,29900,cardParcel)).rejects.toThrow("retry later");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it("books kilograms from the selected parcel with the sole pickup warehouse",async()=>{
    vi.stubEnv("NIMBUSPOST_VERIFIED","true");
    const fetchMock=vi.fn().mockResolvedValue(Response.json({success:true,data:{booking:{awb:"AWB123",label_url:"https://assets.nimbuspost.com/test.pdf"}}}));vi.stubGlobal("fetch",fetchMock);
    expect(await bookShipment(order,items)).toEqual({awb:"AWB123",label:"https://assets.nimbuspost.com/test.pdf"});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body=JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({payment_mode:"prepaid",courier_id:"carrier-a",warehouse_id:"f5215912-0894-45a7-acac-2a5de4de21b1",package:cardParcel,shipping_address:{phone:9876543210,pincode:400001},items:[{price:299,qty:1}]});
  });
  it("never retries ambiguous booking failures and rejects untrusted label hosts",async()=>{
    vi.stubEnv("NIMBUSPOST_VERIFIED","true");
    const fetchMock=vi.fn().mockRejectedValue(new DOMException("Timed out","TimeoutError"));vi.stubGlobal("fetch",fetchMock);
    await expect(bookShipment(order,items)).rejects.toThrow("partially completed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValue(Response.json({success:true,data:{booking:{awb:"AWB123",label_url:"https://nimbuspost.com.evil.test/label"}}}));
    expect(await bookShipment(order,items)).toEqual({awb:"AWB123",label:null});
    fetchMock.mockResolvedValue(Response.json({success:true,data:{booking:{label_url:"https://assets.nimbuspost.com/label"}}}));
    await expect(bookShipment(order,items)).rejects.toThrow("Check booking");
  });
  it("uses the configured warehouse while rejecting any different pickup PIN",async()=>{
    vi.stubEnv("NIMBUSPOST_VERIFIED","true");
    vi.stubEnv("NIMBUSPOST_WAREHOUSE_ID","configured-warehouse");
    const fetchMock=vi.fn().mockResolvedValue(Response.json({success:true,data:{booking:{awb:"AWB123"}}}));vi.stubGlobal("fetch",fetchMock);
    await bookShipment(order,items);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).warehouse_id).toBe("configured-warehouse");
    fetchMock.mockClear();vi.stubEnv("NIMBUSPOST_PICKUP_PINCODE","110001");
    expect(shippingReady()).toBe(false);
    await expect(quoteShipping("400001",1,29900,cardParcel)).rejects.toThrow("PIN 484001");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("maps the documented tracking response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({success:true,data:{orderStatus:"booked",latest:{shipStatus:"delivered"},shipment:{edd:"2026-10-01"}}})));
    expect(await tracking("AWB123")).toMatchObject({status:"delivered",expected:"2026-10-01",scans:[{shipStatus:"delivered"}]});
  });
  it("falls back to order status before scans arrive and blocks malformed tracking data",async()=>{
    const fetchMock=vi.fn().mockResolvedValue(Response.json({success:true,data:{orderStatus:" booked ",latest:null,shipment:{edd:null}}}));vi.stubGlobal("fetch",fetchMock);
    expect(await tracking("AWB123")).toMatchObject({status:"booked",expected:"",scans:[]});
    await expect(tracking("../private")).rejects.toThrow("Invalid tracking");
    fetchMock.mockResolvedValue(Response.json({success:true,data:{latest:{shipStatus:42}}}));
    await expect(tracking("AWB123")).rejects.toThrow("Tracking has not updated");
  });
});
