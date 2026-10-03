import "server-only";
import { getPickup } from './pickup';
export function shippingReady(){
 try { const pickup=getPickup(); return !!(process.env.NIMBUSPOST_API_KEY && process.env.NIMBUSPOST_API_SECRET && pickup.pincode && pickup.id); } catch { return false; }
}
export function launchChecks(){
 return {
  checkoutEnabled:process.env.COMMERCE_LIVE==="true",
  razorpay:!!(process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_")&&process.env.RAZORPAY_KEY_SECRET&&process.env.RAZORPAY_WEBHOOK_SECRET&&process.env.RAZORPAY_ENV==="production"&&process.env.RAZORPAY_WEBHOOK_CONFIGURED==="true"),
  logistics:shippingReady()&&process.env.NIMBUSPOST_VERIFIED==="true",

  approved:process.env.COMMERCE_POLICIES_APPROVED==="true"&&process.env.COMMERCE_PROVIDERS_VERIFIED==="true"&&!!process.env.SHIPPING_POLICY&&!!process.env.REFUND_POLICY,
 };
}
export const checkoutReady=()=>Object.values(launchChecks()).every(Boolean);
