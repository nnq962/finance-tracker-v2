import type { Contact, Debt } from "../_types/debt"

export const contacts: Contact[] = [
  {
    id: "tran-quoc-bao",
    name: "Trần Quốc Bảo",
    initials: "QB",
    phone: "090 123 4567",
    note: "Bạn học đại học",
  },
  {
    id: "nguyen-minh-anh",
    name: "Nguyễn Minh Anh",
    initials: "MA",
    phone: "091 234 5678",
  },
  {
    id: "le-thu-ha",
    name: "Lê Thu Hà",
    initials: "TH",
    phone: "093 345 6789",
  },
  {
    id: "pham-gia-huy",
    name: "Phạm Gia Huy",
    initials: "GH",
    phone: "098 456 7890",
  },
]

export const debts: Debt[] = [
  {
    id: "DEBT-1001",
    contactId: "tran-quoc-bao",
    direction: "borrowed",
    amount: 8_000_000,
    paidAmount: 4_000_000,
    note: "Mượn sửa xe",
    recordedAt: "2026-07-15",
    dueAt: "2026-09-30",
    status: "active",
  },
  {
    id: "DEBT-1002",
    contactId: "nguyen-minh-anh",
    direction: "lent",
    amount: 5_000_000,
    paidAmount: 0,
    note: "Cho mượn đóng học phí",
    recordedAt: "2026-08-02",
    dueAt: "2026-10-01",
    status: "active",
  },
  {
    id: "DEBT-1003",
    contactId: "le-thu-ha",
    direction: "lent",
    amount: 1_200_000,
    paidAmount: 0,
    note: "Mua vé máy bay giúp",
    recordedAt: "2026-09-01",
    status: "active",
  },
]
