export type DebtDirection = "lent" | "borrowed"

export type DebtStatus = "active" | "overdue" | "settled"

export type Contact = {
  id: string
  name: string
  initials: string
  phone?: string
  note?: string
}

export type Debt = {
  id: string
  contactId: string
  direction: DebtDirection
  amount: number
  paidAmount: number
  note: string
  recordedAt: string
  dueAt?: string
  status: DebtStatus
}

export type DebtSummaryData = {
  totalLent: number
  totalBorrowed: number
  netBalance: number
}

export type NewContact = Omit<Contact, "id" | "initials">

export type NewDebt = Omit<Debt, "id" | "status">
