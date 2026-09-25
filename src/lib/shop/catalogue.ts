export type Variant = { id: string; name: string; image: string; video: string; price_paise: number | null; available: boolean };
export type Product = { slug: string; name: string; platform: string; description: string; colour: string; category: "Social" | "Reviews" | "All-in-one"; active: boolean; specifications: string; materials: string; instructions: string; variants: Variant[] };
const variant = (id: string, name = "Original"): Variant => ({ id, name, image: `/shop/${id}.webp`, video: `/shop/${id}.mp4`, price_paise: null, available: true });
export const catalogue: Product[] = [
 { slug:"google-reviews", name:"Google Review Card", platform:"Google", description:"Make it easy for happy customers to share their experience. A tap takes them straight to your review page.", colour:"#e8e7e2", category:"Reviews", variants:[variant("google-reviews")] },
 { slug:"instagram", name:"Instagram Connect Card", platform:"Instagram", description:"From a real-world hello to your next follower. Bring your Instagram profile within a tap.", colour:"#f2e4eb", category:"Social", variants:[variant("instagram")] },
 { slug:"whatsapp", name:"WhatsApp Connect Card", platform:"WhatsApp", description:"Start the conversation. Give customers a direct way to reach your business on WhatsApp.", colour:"#e1ebe3", category:"Social", variants:[variant("whatsapp")] },
 { slug:"multi-link", name:"All-in-One Connect Card", platform:"Multi-Link", description:"One card. All your connections. Bring your profiles together in one easy-to-share destination.", colour:"#efebdf", category:"All-in-one", variants:[variant("multi-link-classic","Classic"),variant("multi-link-custom","Custom Logo")] },
 { slug:"linkedin", name:"LinkedIn Connect Card", platform:"LinkedIn", description:"Make introductions that last. Share your professional profile without spelling out your name.", colour:"#e3ebf2", category:"Social", variants:[variant("linkedin")] },
 { slug:"zomato", name:"Zomato Review Card", platform:"Zomato", description:"Keep the conversation going after the last bite. Connect diners to your Zomato page.", colour:"#f2e3e3", category:"Reviews", variants:[variant("zomato")] },
 { slug:"facebook", name:"Facebook Connect Card", platform:"Facebook", description:"Give your local community a direct connection to your Facebook page, news and updates.", colour:"#e3e9f3", category:"Social", variants:[variant("facebook")] },
].map(p => ({...p, active:true, specifications:"", materials:"", instructions:""})) as Product[];
export const priceLabel = (paise: number | null) => paise === null ? "₹ xxx" : new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(paise/100);

