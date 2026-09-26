import "server-only";
export function shippingReady(){
 return !!(process.env.NIMBUSPOST_API_KEY && process.env.NIMBUSPOST_API_SECRET && /^[1-9]\d{5}$/.test(process.env.NIMBUSPOST_PICKUP_PINCODE || "") && ["PARCEL_LENGTH_CM","PARCEL_WIDTH_CM","PARCEL_UNIT_HEIGHT_CM","PARCEL_UNIT_WEIGHT_KG"].every(k=>Number.isFinite(Number(process.env[k])) && Number(process.env[k])>0));
}
export function launchChecks(){
 return {
  checkoutEnabled:process.env.COMMERCE_LIVE==="true",
  payu:!!(process.env.PAYU_KEY&&process.env.PAYU_SALT&&process.env.PAYU_ENV==="production"),
  logistics:shippingReady()&&!!process.env.NIMBUSPOST_WAREHOUSE_ID&&process.env.NIMBUSPOST_VERIFIED==="true",
  parcel:["PARCEL_LENGTH_CM","PARCEL_WIDTH_CM","PARCEL_UNIT_HEIGHT_CM","PARCEL_UNIT_WEIGHT_KG"].every(k=>Number(process.env[k])>0),
  approved:process.env.COMMERCE_POLICIES_APPROVED==="true"&&process.env.COMMERCE_PROVIDERS_VERIFIED==="true"&&!!process.env.SHIPPING_POLICY&&!!process.env.REFUND_POLICY,
 };
}
export const checkoutReady=()=>Object.values(launchChecks()).every(Boolean);
