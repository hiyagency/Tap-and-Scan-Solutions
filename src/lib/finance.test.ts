import { describe, expect, it } from "vitest";
import { calculateFinanceTotals } from "./finance";

describe("calculateFinanceTotals", () => {
  it("uses only the selected month and keeps income and expenses separate", () => {
    const result = calculateFinanceTotals([
      { type: "income", amount_paise: 100_000, occurred_on: "2026-08-02" },
      { type: "expense", amount_paise: 35_000, occurred_on: "2026-08-03" },
      { type: "income", amount_paise: 999_000, occurred_on: "2026-07-30" },
    ], [], "2026-08");
    expect(result).toMatchObject({ income: 100_000, expenses: 35_000, net: 65_000 });
  });

  it("counts only the unpaid portion of open dues", () => {
    const result = calculateFinanceTotals([], [
      { status: "partial", amount_paise: 200_000, paid_amount_paise: 75_000 },
      { status: "pending", amount_paise: 50_000, paid_amount_paise: 0 },
      { status: "paid", amount_paise: 90_000, paid_amount_paise: 90_000 },
      { status: "cancelled", amount_paise: 300_000, paid_amount_paise: 0 },
    ], "2026-08");
    expect(result.outstanding).toBe(175_000);
  });
});
