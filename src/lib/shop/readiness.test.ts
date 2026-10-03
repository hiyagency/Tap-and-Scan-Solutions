import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
import { checkoutReady, launchChecks } from "./readiness";
beforeEach(()=>{
  const env={NIMBUSPOST_API_KEY:"test-key",NIMBUSPOST_API_SECRET:"test-secret",NIMBUSPOST_PICKUP_PINCODE:"484001",NIMBUSPOST_WAREHOUSE_ID:"",NIMBUSPOST_VERIFIED:"true",RAZORPAY_KEY_ID:"rzp_live_test",RAZORPAY_KEY_SECRET:"test-secret",RAZORPAY_WEBHOOK_SECRET:"webhook-secret",RAZORPAY_WEBHOOK_CONFIGURED:"true",RAZORPAY_ENV:"production",COMMERCE_LIVE:"true",COMMERCE_POLICIES_APPROVED:"true",COMMERCE_PROVIDERS_VERIFIED:"true",SHIPPING_POLICY:"Approved shipping terms",REFUND_POLICY:"Approved refund terms"};
  for(const [key,value] of Object.entries(env))vi.stubEnv(key,value);
});
afterEach(()=>vi.unstubAllEnvs());
describe("live checkout readiness",()=>{
  it("requires live Razorpay credentials and a confirmed webhook",()=>{
    expect(checkoutReady()).toBe(true);
    vi.stubEnv("RAZORPAY_WEBHOOK_CONFIGURED","false");
    expect(launchChecks().razorpay).toBe(false);
    expect(checkoutReady()).toBe(false);
    vi.stubEnv("RAZORPAY_WEBHOOK_CONFIGURED","true");
    vi.stubEnv("RAZORPAY_KEY_ID","rzp_test_example");
    expect(checkoutReady()).toBe(false);
  });
  it("blocks mismatched pickup PIN or an unverified logistics provider",()=>{
    vi.stubEnv("NIMBUSPOST_PICKUP_PINCODE","110001");
    expect(launchChecks().logistics).toBe(false);
    expect(checkoutReady()).toBe(false);
    vi.stubEnv("NIMBUSPOST_PICKUP_PINCODE","484001");
    vi.stubEnv("NIMBUSPOST_VERIFIED","false");
    expect(checkoutReady()).toBe(false);
  });
});
