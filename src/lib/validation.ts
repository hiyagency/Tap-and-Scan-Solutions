import { z } from "zod";

export const solutionOptions = [
  "U2L.AI tracked QR",
  "Monthly scan analytics",
  "QR stand",
  "NFC tag or card",
  "Restaurant menu",
  "Google reviews",
  "Instagram growth",
  "Private materials",
  "Custom solution",
] as const;

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  businessName: z.string().trim().min(2, "Please enter your business name.").max(120),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{8,17}$/, "Enter a valid phone or WhatsApp number."),
  email: z.union([z.literal(""), z.email("Enter a valid email address.")]).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  businessType: z.string().trim().max(100).optional().default(""),
  interests: z.array(z.enum(solutionOptions)).max(solutionOptions.length).default([]),
  quantity: z.string().trim().max(60).optional().default(""),
  timeline: z.string().trim().max(60).optional().default(""),
  message: z.string().trim().max(1200).optional().default(""),
  consent: z.literal(true, { error: "Please consent to being contacted about this enquiry." }),
  website: z.string().max(0).optional().default(""),
});

export type LeadPayload = z.infer<typeof leadSchema>;

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
});
