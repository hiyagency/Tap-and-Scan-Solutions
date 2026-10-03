import type { Product } from "./catalogue";

const base = { category: "Keychains" as const, kind: "keychain" as const, active: true, qr: false, customLogo: false, packedWeightGrams:250, shipping:{weightGrams:250,lengthCm:10,widthCm:10,heightCm:10} };
const variant = (id: string, name: string) => ({ id, name, image: `/shop/${id}-studio.webp`, video: "", price_paise: 24900, available: true });

// Facts paraphrased from the four user-supplied Amazon listings; prices set by NFC.HIY.
export const keychains: Product[] = [
  { ...base, slug: "social-profile-keychain", name: "Social Profile NFC Keychain", platform: "Social sharing", colour: "#e7e8e3",
    description: "Your profile, always within reach. Carry a compact NFC keychain that opens your chosen social profile, business page or website with a tap.",
    specifications: "Black square keychain\nDimensions: 45 × 45 × 3 mm\nListed weight: 30 g\nProgrammable destination link\nCountry of origin: India",
    materials: "PLA body with a metal keyring attachment.",
    instructions: "Share your destination link with our team on WhatsApp after ordering. Once configured, hold the keychain near the NFC reader of an unlocked NFC-enabled phone and open the link prompt.",
    variants: [variant("social-profile-keychain", "Black")],
  },
  { ...base, slug: "google-review-keyring", name: "Google Review NFC Keyring", platform: "Google reviews", colour: "#efede5",
    description: "Take your review link to the customer. A compact white keyring makes sharing your Google review page as simple as a tap—without a printed QR code.",
    specifications: "White finish\nFixed Google-review design\nPersonalized review destination\nNFC tap only; no QR code\nIncludes one keyring\nCountry of origin: India",
    materials: "Acrylic keyring with metal ring attachment.",
    instructions: "Our team collects your Google review link on WhatsApp. Customers hold an unlocked NFC-enabled phone near the keyring to open the review page and share their own genuine feedback.",
    variants: [variant("google-review-keyring", "White · fixed design")],
  },
  { ...base, slug: "faux-leather-nfc-keychains", name: "Faux-Leather NFC Keychains", platform: "Everyday carry", colour: "#e6e5e1",
    description: "A quieter way to connect. These black faux-leather key fobs keep a programmable NFC link alongside your everyday keys. Supplied as a set of two.",
    specifications: "Set of 2 black key fobs\nChip: NTAG213\nUser memory: 144 bytes\nProgrammable NFC data\nNot intended for direct use on metal surfaces",
    materials: "Black faux-leather finish with stitched edges and metal keyring hardware.",
    instructions: "Use a compatible NFC writing app to save your chosen link or contact data. Tap with an NFC-enabled phone to read it. Automation actions depend on the phone and app; access-control compatibility must be checked separately.",
    variants: [variant("faux-leather-nfc-keychains", "Black · set of 2")],
  },
  { ...base, slug: "ntag216-epoxy-tags", name: "NTAG216 Epoxy NFC Tags", platform: "Programmable NFC", colour: "#e5eaf0",
    description: "Small tags. More room for your ideas. A pair of glossy NFC tags with 888 bytes of writable user memory for contact details, links or supported phone automations.",
    specifications: "Set of 2 tags\nChip: NXP NTAG216\nUser memory: 888 bytes, read/write\nDiameter: 30 mm\nHanging eye with elastic string",
    materials: "Smooth, glossy epoxy-style jelly coating.",
    instructions: "Write your link, contact record or supported action using a compatible NFC app. Read it by holding an NFC-enabled phone close to the tag. Phone automations may need a supporting app and device setup.",
    variants: [variant("ntag216-epoxy-tags", "Set of 2")],
  },
];
