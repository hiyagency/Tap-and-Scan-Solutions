// Private operational configuration; never import this module into storefront components.
import 'server-only';
// The full pickup address stays in NimbusPost, not in public site content.
const VERIFIED_PICKUP = { id:'f5215912-0894-45a7-acac-2a5de4de21b1', pincode:'484001' };
export function getPickup() {
  const id=process.env.NIMBUSPOST_WAREHOUSE_ID?.trim() || VERIFIED_PICKUP.id;
  const pincode=process.env.NIMBUSPOST_PICKUP_PINCODE?.trim() || VERIFIED_PICKUP.pincode;
  if (pincode!==VERIFIED_PICKUP.pincode) throw new Error("The pickup warehouse must use PIN 484001.");
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id)) throw new Error("The pickup warehouse configuration needs attention.");
  return {id,pincode};
}
