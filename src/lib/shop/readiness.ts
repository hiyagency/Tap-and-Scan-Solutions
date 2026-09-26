import "server-only";
export function launchChecks(){
 return {
  checkoutEnabled:process.env.COMMERCE_LIVE==="true",
  payu:!!(process.env.PAYU_KEY&&process.env.PAYU_SALT&&process.env.PAYU_ENV==="production"),
  logistics:!!(process.env.NIMBUSPOST_EMAIL&&process.env.NIMBUSPOST_PASSWORD&&process.env.NIMBUSPOST_PICKUP_JSON&&process.env.NIMBUSPOST_PICKUP_PINCODE&&process.env.NIMBUSPOST_VERIFIED==="true"),
  parcel:["PARCEL_LENGTH_CM","PARCEL_WIDTH_CM","PARCEL_UNIT_HEIGHT_CM","PARCEL_UNIT_WEIGHT_KG"].every(k=>Number(process.env[k])>0),
  approved:process.env.COMMERCE_POLICIES_APPROVED==="true"&&process.env.COMMERCE_PROVIDERS_VERIFIED==="true"&&!!process.env.SHIPPING_POLICY&&!!process.env.REFUND_POLICY,
 };
}
export const checkoutReady=()=>Object.values(launchChecks()).every(Boolean);
