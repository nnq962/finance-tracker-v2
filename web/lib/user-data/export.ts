import "server-only"

import ExcelJS from "exceljs"
import { strToU8, zipSync } from "fflate"

import { accountTypeLabels } from "@/lib/accounts/labels"
import type { AccountType } from "@/lib/accounts/types"
import { getDb } from "@/lib/db/client"

import type { ExportFormat, ExportPart } from "./export-options"

type Cell = string | number | null
type Sheet = { name: string; file: string; columns: string[]; rows: Cell[][] }

const TIME_ZONE = "Asia/Ho_Chi_Minh"
const dateFormat = new Intl.DateTimeFormat("vi-VN", { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" })
const timeFormat = new Intl.DateTimeFormat("vi-VN", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false })

const kindLabels: Record<string, string> = { expense: "Chi", income: "Thu", transfer: "Chuyển khoản" }
const directionLabels: Record<string, string> = { lent: "Cho vay", borrowed: "Đi vay" }
const periodLabels: Record<string, string> = { month: "tháng", year: "năm" }
const categoryTypeLabels: Record<string, string> = { expense: "Chi", income: "Thu" }
const statusLabels: Record<string, string> = { active: "Đang dùng", archived: "Đã khoá", hidden: "Đã ẩn" }

const yesNo = (value: boolean) => (value ? "Có" : "")
const dateOf = (value: Date | string | null) => (value ? dateFormat.format(new Date(value)) : null)
const timeOf = (value: Date | string | null) => (value ? timeFormat.format(new Date(value)) : null)

/**
 * Everything the user recorded, as sheets of plain rows with Vietnamese
 * headers: amounts in đồng as numbers, dates and times in Vietnam's time,
 * ids replaced by the names they point to. Nothing about the sign-in, the
 * plan or payments: the export is the user's bookkeeping, not the account.
 */
async function collectSheets(userId: string, parts: ReadonlySet<ExportPart>): Promise<Sheet[]> {
  const db = getDb()
  const [accounts, groups, items, contacts, debts] = await Promise.all([
    db.selectFrom("accounts").selectAll().where("userId", "=", userId).orderBy("createdAt").execute(),
    db.selectFrom("categoryGroups").selectAll().where("userId", "=", userId).orderBy("sortOrder").execute(),
    db.selectFrom("categoryItems").selectAll().where("userId", "=", userId).orderBy("sortOrder").execute(),
    db.selectFrom("contacts").selectAll().where("userId", "=", userId).orderBy("name").execute(),
    db.selectFrom("debts").selectAll().where("userId", "=", userId).orderBy("recordedAt", "desc").execute(),
  ])
  const accountName = new Map(accounts.map((account) => [account.id, account.name]))
  const groupName = new Map(groups.map((group) => [group.id, group.name]))
  const itemOf = new Map(items.map((item) => [item.id, item]))
  const contactName = new Map(contacts.map((contact) => [contact.id, contact.name]))
  const debtContact = new Map(debts.map((debt) => [debt.id, contactName.get(debt.contactId) ?? ""]))

  const sheets: Sheet[] = []

  if (parts.has("transactions")) {
    const transactions = await db.selectFrom("transactions").selectAll().where("userId", "=", userId).orderBy("occurredAt", "desc").execute()
    sheets.push({
      name: "Giao dịch",
      file: "giao-dich",
      columns: ["Ngày", "Giờ", "Loại", "Số tiền", "Phí", "Tài khoản", "Từ tài khoản", "Đến tài khoản", "Nhóm hạng mục", "Hạng mục", "Ghi chú", "Vay nợ với", "Ngoài báo cáo", "Điều chỉnh số dư"],
      rows: transactions.map((row) => {
        const item = row.categoryItemId ? itemOf.get(row.categoryItemId) : undefined
        return [
          dateOf(row.occurredAt),
          timeOf(row.occurredAt),
          kindLabels[row.kind] ?? row.kind,
          row.amount,
          row.fee || null,
          row.accountId ? (accountName.get(row.accountId) ?? null) : null,
          row.fromAccountId ? (accountName.get(row.fromAccountId) ?? null) : null,
          row.toAccountId ? (accountName.get(row.toAccountId) ?? null) : null,
          item ? (groupName.get(item.groupId) ?? null) : null,
          item?.name ?? null,
          row.note,
          row.debtId ? (debtContact.get(row.debtId) ?? null) : null,
          yesNo(row.excluded),
          yesNo(row.adjustment),
        ]
      }),
    })
  }

  if (parts.has("accounts")) {
    sheets.push({
      name: "Tài khoản",
      file: "tai-khoan",
      columns: ["Tên", "Loại", "Số dư", "Số dư ban đầu", "Ngày mở", "Trạng thái", "Ngoài báo cáo", "Mục tiêu hũ", "Hạn hũ", "Hũ hoàn thành", "Ghi chú"],
      rows: accounts.map((row) => [
        row.name,
        accountTypeLabels[row.type as AccountType] ?? row.type,
        row.balance,
        row.openingBalance,
        dateOf(row.openedAt),
        statusLabels[row.status] ?? row.status,
        yesNo(row.excluded),
        row.goalTarget,
        row.goalDue,
        dateOf(row.completedAt),
        row.note,
      ]),
    })
  }

  if (parts.has("debts")) {
    const payments = await db.selectFrom("debtPayments").selectAll().where("userId", "=", userId).orderBy("paidAt", "desc").execute()
    const debtById = new Map(debts.map((debt) => [debt.id, debt]))
    sheets.push({
      name: "Vay nợ",
      file: "vay-no",
      columns: ["Người", "Chiều", "Số tiền", "Ngày ghi", "Đến hạn", "Lãi suất (%)", "Kỳ lãi", "Tài khoản", "Ghi chú"],
      rows: debts.map((row) => [
        contactName.get(row.contactId) ?? null,
        directionLabels[row.direction] ?? row.direction,
        row.amount,
        row.recordedAt,
        row.dueAt,
        row.interestRate,
        row.interestPeriod ? (periodLabels[row.interestPeriod] ?? row.interestPeriod) : null,
        row.accountId ? (accountName.get(row.accountId) ?? null) : null,
        row.note,
      ]),
    })
    sheets.push({
      name: "Trả nợ",
      file: "tra-no",
      columns: ["Người", "Chiều", "Ngày", "Giờ", "Số tiền", "Tài khoản", "Ghi chú"],
      rows: payments.map((row) => {
        const debt = debtById.get(row.debtId)
        return [
          debt ? (contactName.get(debt.contactId) ?? null) : null,
          debt ? (directionLabels[debt.direction] ?? debt.direction) : null,
          row.paidAt,
          row.paidTime,
          row.amount,
          accountName.get(row.accountId) ?? null,
          row.note,
        ]
      }),
    })
    sheets.push({
      name: "Người liên hệ",
      file: "nguoi-lien-he",
      columns: ["Tên", "Quan hệ", "Điện thoại", "Ghi chú"],
      rows: contacts.map((row) => [row.name, row.relationship, row.phone, row.note]),
    })
  }

  if (parts.has("budgets")) {
    const budgets = await db.selectFrom("budgets").selectAll().where("userId", "=", userId).execute()
    sheets.push({
      name: "Hạn mức",
      file: "han-muc",
      columns: ["Nhóm", "Loại", "Số tiền mỗi tháng"],
      rows: budgets.map((row) => [
        row.categoryGroupId ? (groupName.get(row.categoryGroupId) ?? null) : "Cả tháng",
        categoryTypeLabels[row.categoryType] ?? row.categoryType,
        row.amount,
      ]),
    })
  }

  if (parts.has("categories")) {
    sheets.push({
      name: "Hạng mục",
      file: "hang-muc",
      columns: ["Nhóm", "Loại", "Hạng mục", "Trạng thái"],
      rows: items.map((row) => [
        groupName.get(row.groupId) ?? null,
        categoryTypeLabels[row.type] ?? row.type,
        row.name,
        statusLabels[row.status] ?? row.status,
      ]),
    })
  }

  return sheets
}

function csvOf(sheet: Sheet) {
  const escape = (cell: Cell) => {
    if (cell === null || cell === undefined) return ""
    const text = String(cell)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [sheet.columns.map(escape).join(","), ...sheet.rows.map((row) => row.map(escape).join(","))]
  // The byte-order mark, so Excel opens the Vietnamese text as UTF-8.
  return "﻿" + lines.join("\r\n") + "\r\n"
}

/** The file to send: its bytes, name and media type. */
export async function buildExport(userId: string, format: ExportFormat, parts: ReadonlySet<ExportPart>) {
  const sheets = await collectSheets(userId, parts)
  const stamp = new Date().toLocaleDateString("sv-SE", { timeZone: TIME_ZONE })

  if (format === "csv") {
    const files: Record<string, Uint8Array> = {}
    for (const sheet of sheets) files[`${sheet.file}.csv`] = strToU8(csvOf(sheet))
    return { body: zipSync(files, { level: 6 }), filename: `timi-du-lieu-${stamp}.zip`, type: "application/zip" }
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Timi"
  workbook.created = new Date()
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name, { views: [{ state: "frozen", ySplit: 1 }] })
    worksheet.columns = sheet.columns.map((header) => ({ header, width: Math.max(12, Math.min(40, header.length + 6)) }))
    worksheet.getRow(1).font = { bold: true }
    worksheet.addRows(sheet.rows)
    sheet.columns.forEach((header, index) => {
      if (/Số tiền|Phí|Số dư|Mục tiêu/.test(header)) worksheet.getColumn(index + 1).numFmt = "#,##0"
    })
  }
  const buffer = await workbook.xlsx.writeBuffer()
  return { body: new Uint8Array(buffer as ArrayBuffer), filename: `timi-du-lieu-${stamp}.xlsx`, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
}
