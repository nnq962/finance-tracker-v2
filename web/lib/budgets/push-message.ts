import { budgetPercent, perDay } from "@/lib/budgets/calculations"
import { formatCurrency } from "@/lib/format-currency"

/** The push for a limit at a level: past it, how far; near it, what is left a day. */
export function budgetPushMessage(
  name: string | null,
  line: { spent: number; limit: number },
  level: 80 | 90 | 100,
  days: number,
) {
  if (level === 100) {
    return {
      title: name ? `Vượt hạn mức ${name}` : "Vượt hạn mức tổng",
      body: `Đã chi ${formatCurrency(line.spent)}, vượt ${formatCurrency(line.spent - line.limit)}.`,
    }
  }
  const percent = Math.min(budgetPercent(line.spent, line.limit), 100)
  const left = line.limit - line.spent
  return {
    title: name ? `${name} đã dùng ${percent}% hạn mức` : `Đã dùng ${percent}% hạn mức tổng`,
    body:
      left > 0
        ? `Còn ${formatCurrency(left)} cho ${days} ngày, khoảng ${formatCurrency(perDay(line.spent, line.limit, days))} mỗi ngày.`
        : "Đã dùng hết hạn mức tháng này.",
  }
}
