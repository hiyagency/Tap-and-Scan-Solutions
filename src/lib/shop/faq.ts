import { CARD_OFFER } from "./offers";
// Factual answers shared by the homepage and dedicated help page.
// Shipping dates, warranty and returns are intentionally not invented here.
export const shopFaq = [
 ["What is an NFC card?", "A card with a contactless chip that lets a compatible phone open a configured destination link. Our QR cards also provide a camera-scannable route."],
 ["What is the Smart NFC Standee made from?", "The 4 × 6 inch standee has an acrylic body, high-quality printed sticker and resin-coated surface. It is designed for everyday water exposure and scuffs. Avoid abrasive cleaners and prolonged soaking."],
 ["Does someone need an app to use it?", "No NFC.HIY app is needed to read a web link. The phone needs NFC support with NFC enabled, or a camera that can scan the QR. The destination itself may require an account or its own app."],
 ["Can I add my logo?", "Supported designs offer an optional PNG upload, up to 10 MB. Our team contacts you on WhatsApp to confirm your design and destination before production."],
 ["Can I change my link later?", "Every NFC.HIY product with a printed QR uses a custom U2L.AI smart QR setup. Contact our team to request a destination update. You do not need to reprint the QR when your profile address changes."],
 ["How does the free-card offer work?", "Add three eligible NFC cards to your cart. The lowest-priced card is free. The offer applies to each set of three eligible cards; keychains are not included. Tax and shipping are calculated separately."],
 ["How are shipping charges calculated?", "Enter your delivery PIN at checkout. Available NimbusPost rates use the configured package dimensions and weight. The quoted charge is displayed before payment. Delivery timing depends on design approval, the destination and the courier."],
 ["How can I track an order?", "Sign in with the Google account used for checkout, then open My orders. Your order page shows the recorded payment, design and fulfilment progress, with tracking information when shipping is booked."],
 ["Who can help me choose or configure a product?", "Contact hello@hiy.agency or WhatsApp +91 9109167827. Tell us which profile, review page or business destination you want to share."],
] as const;
export const visibleShopFaq = shopFaq.filter(([question]) => CARD_OFFER.enabled || question !== "How does the free-card offer work?");
