/**
 * Where the debts are: the Vay nợ view of Giao dịch since 2026-10-21 (the
 * debts page merged in; /debts redirects here), with a debt to open in its
 * sheet.
 */
export function debtsUrl(debtId?: string) {
  return debtId ? `/transactions?view=debts&debt=${encodeURIComponent(debtId)}` : "/transactions?view=debts"
}
