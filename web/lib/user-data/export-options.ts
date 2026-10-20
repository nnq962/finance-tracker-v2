/** The parts of the user's data an export can hold, shared by the sheet and the route. */
export const exportParts = ["transactions", "accounts", "debts", "budgets", "categories"] as const
export type ExportPart = (typeof exportParts)[number]
export type ExportFormat = "xlsx" | "csv"
