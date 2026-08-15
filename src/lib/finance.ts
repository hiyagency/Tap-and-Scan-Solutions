export type FinanceTransaction = { type: "income" | "expense"; amount_paise: number; occurred_on: string };
export type FinanceDue = { status: string; amount_paise: number; paid_amount_paise: number };

export function calculateFinanceTotals(transactions: FinanceTransaction[], dues: FinanceDue[], month: string) {
  const monthTransactions = transactions.filter((transaction) => transaction.occurred_on.startsWith(month));
  const income = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount_paise, 0);
  const expenses = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount_paise, 0);
  const outstanding = dues
    .filter((due) => !["paid", "cancelled"].includes(due.status))
    .reduce((sum, due) => sum + due.amount_paise - due.paid_amount_paise, 0);
  return { income, expenses, net: income - expenses, outstanding };
}

