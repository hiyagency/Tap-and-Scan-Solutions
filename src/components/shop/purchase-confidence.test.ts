import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseConfidenceGrid } from "./purchase-confidence";
import { catalogue, type Product } from "../../lib/shop/catalogue";

const render = (changes: Partial<Product> = {}, variantAvailable = true) =>
  renderToStaticMarkup(createElement(PurchaseConfidenceGrid, {
    product: { ...catalogue[0], ...changes }, variantAvailable,
  }));

describe("purchase confidence uses actual product configuration", () => {
  it("does not invent a quantity when inventory is unknown", () => {
    const html = render({ stock: undefined });
    expect(html).toContain(">Available</strong>");
    expect(html).not.toContain("Only ");
    expect(html).not.toContain("In stock");
  });
  it("shows genuine low stock", () => {
    const html = render({ stock: 3 });
    expect(html).toContain('data-state="low"');
    expect(html).toContain("Only 3 left");
  });
  it("uses a neutral in-stock state above the low-stock threshold", () => {
    const html = render({ stock: 10 });
    expect(html).toContain("In stock");
    expect(html).not.toContain("Only ");
  });
  it.each([
    [{ stock: 0 }, true],
    [{ active: false, stock: 10 }, true],
    [{ stock: 10 }, false],
  ] as [Partial<Product>, boolean][])("respects product and variant availability %j", (changes, available) => {
    const html = render(changes, available);
    expect(html).toContain('data-state="unavailable"');
    expect(html).toContain("Currently unavailable");
    expect(html).not.toContain("Only 0 left");
  });
  it("offers a checkout quote only when parcel configuration exists", () => {
    expect(render()).toContain("Calculated for your PIN");
    const html = render({ shipping: undefined });
    expect(html).toContain("Confirm with our team");
    expect(html).not.toContain("Rate shown at checkout");
  });
  it("does not imply QR backup for NFC-only products", () => {
    expect(render()).toContain("Or scan the QR with your camera");
    const html = render({ qr: false });
    expect(html).toContain("Check your phone’s NFC support");
    expect(html).not.toContain("scan the QR");
  });
});
