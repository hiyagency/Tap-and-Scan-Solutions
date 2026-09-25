import "server-only";
export function launchChecks(){
 return {
  checkoutEnabled:process.env.COMMERCE_LIVE==="true",
  payu:!!(process.env.PAYU_KEY&&process.env.PAYU_SALT&&process.env.PAYU_ENV==="production"),
  logistics:!!(process.env.ITHINK_ACCESS_TOKEN&&process.env.ITHINK_SECRET_KEY&&process.env.ITHINK_PICKUP_ID&&process.env.ITHINK_RETURN_ID&&process.env.ITHINK_PICKUP_PINCODE&&process.env.ITHINK_COURIER&&process.env.ITHINK_ENV==="production"),
  parcel:["PARCEL_LENGTH_CM","PARCEL_WIDTH_CM","PARCEL_UNIT_HEIGHT_CM","PARCEL_UNIT_WEIGHT_KG"].every(k=>Number(process.env[k])>0),
  approved:process.env.COMMERCE_POLICIES_APPROVED==="true"&&process.env.COMMERCE_PROVIDERS_VERIFIED==="true"&&!!process.env.SHIPPING_POLICY&&!!process.env.REFUND_POLICY,
 };
}
export const checkoutReady=()=>Object.values(launchChecks()).every(Boolean);
