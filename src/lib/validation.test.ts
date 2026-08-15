import { describe, expect, it } from "vitest";
import { leadSchema } from "./validation";

const validLead = {
  name: "Aarav Shah",
  businessName: "Aarav & Co.",
  phone: "+91 98765 43210",
  email: "aarav@example.com",
  city: "Indore",
  businessType: "Professional services",
  interests: ["QR stand"],
  quantity: "6",
  timeline: "Within 2 weeks",
  message: "Need a reception stand.",
  consent: true,
  website: "",
};

describe("leadSchema", () => {
  it("accepts the complete enquiry payload", () => {
    expect(leadSchema.safeParse(validLead).success).toBe(true);
  });

  it("accepts tracked U2L.AI QR and monthly analytics interests", () => {
    const result = leadSchema.safeParse({
      ...validLead,
      interests: ["U2L.AI tracked QR", "Monthly scan analytics"],
    });
    expect(result.success).toBe(true);
  });

  it("requires explicit contact consent", () => {
    const result = leadSchema.safeParse({ ...validLead, consent: false });
    expect(result.success).toBe(false);
  });

  it("rejects malformed phone numbers and honeypot text", () => {
    expect(leadSchema.safeParse({ ...validLead, phone: "12" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...validLead, website: "spam.example" }).success).toBe(false);
  });
});
