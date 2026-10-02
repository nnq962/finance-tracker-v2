"use client"

import * as React from "react"
import { Page, PageHeader } from "@/components/page"
import type { Account } from "@/lib/accounts/types"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createContactAction, updateContactAction, deleteContactAction, createDebtAction, saveDebtPaymentAction, changeDebtAction } from "../actions"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"
import { getDebtSummary } from "../_lib/get-debt-summary"
import type {
  Contact,
  Debt,
  NewDebt,
  NewContact,
  NewDebtPayment,
} from "../_types/debt"

import { AddDebtSheet } from "./add-debt-sheet"
import { ContactsSheet } from "./contacts-sheet"
import { DebtSummary } from "./debt-summary"
import { DebtsView } from "./debts-view"

type DebtsDashboardProps = {
  selectedDebtId?: string
  accounts: Account[]
  initialContacts: Contact[]
  initialDebts: Debt[]
}

export function DebtsDashboard({
  accounts,
  initialContacts,
  initialDebts,
  selectedDebtId,
}: DebtsDashboardProps) {
  const router = useRouter()
  const contacts = initialContacts
  const debts = initialDebts
  const summary = getDebtSummary(debts)
  const operations = React.useRef(new Map<string, string>())
  const [contactsOpen, setContactsOpen] = React.useState(false)

  // Keep the same request ID after a lost response; successful requests release it.
  async function execute<T>(key: string, action: (operationId: string) => Promise<{ success: true; data: T } | { success: false; error: string }>) {
    const operationId = operations.current.get(key) ?? crypto.randomUUID()
    operations.current.set(key, operationId)
    const result = await action(operationId)
    if (!result.success) throw new Error(result.error)
    operations.current.delete(key)
    router.refresh()
    return result.data
  }

  const addContact = async (values: NewContact) => {
    const contact = await execute(JSON.stringify(["contact", values]), (id) => createContactAction(values, id))
    toast.success("Đã thêm người liên hệ.")
    return contact
  }
  const editContact = async (id: string, values: NewContact) => {
    await execute(JSON.stringify(["contact", id, values]), () => updateContactAction(id, values))
    toast.success("Đã cập nhật người liên hệ.")
  }
  const deleteContact = async (id: string) => {
    const contact = contacts.find((item) => item.id === id)
    scheduleUndoableDelete({
      key: `contact:${id}`,
      title: `Sắp xoá ${contact?.name ?? "người liên hệ"}`,
      description: "Người liên hệ sẽ bị xoá khỏi danh bạ sau 6 giây.",
      pendingMessage: "Đang xoá người liên hệ…",
      successMessage: "Đã xoá người liên hệ.",
      undoMessage: "Đã giữ lại người liên hệ.",
      errorMessage: "Không thể xoá người liên hệ.",
      onCommit: () =>
        execute(`delete-contact-${id}`, () => deleteContactAction(id)),
    })
  }
  const addDebt = async (values: NewDebt) => {
    await execute(JSON.stringify(["debt", values]), (id) => createDebtAction(values, id))
    toast.success(values.recordingMode === "opening" ? "Đã ghi nhận nợ có sẵn. Số dư tài khoản giữ nguyên." : "Đã tạo khoản nợ và cập nhật số dư.")
  }
  const changePayment = async (debtId: string, paymentId: string | undefined, values: NewDebtPayment | null) => {
    if (values === null && paymentId) {
      scheduleUndoableDelete({
        key: `debt-payment:${debtId}:${paymentId}`,
        title: "Sắp xoá lần thanh toán",
        description:
          "Lần thanh toán và tác động số dư sẽ bị xoá sau 6 giây.",
        pendingMessage: "Đang xoá lần thanh toán…",
        successMessage: "Đã xoá lần thanh toán.",
        undoMessage: "Đã giữ lại lần thanh toán.",
        errorMessage: "Không thể xoá lần thanh toán.",
        onCommit: () =>
          execute(
            JSON.stringify(["payment", debtId, paymentId, null]),
            (id) => saveDebtPaymentAction(debtId, paymentId, null, id),
          ),
      })
      return
    }

    await execute(JSON.stringify(["payment", debtId, paymentId, values]), (id) => saveDebtPaymentAction(debtId, paymentId, values, id))
  }

  const addDebtSheet = (
    <AddDebtSheet accounts={accounts} contacts={contacts} onAddDebt={addDebt} onAddContact={addContact} />
  )

  return (
    <Page>
      <PageHeader title="Nợ & Cho vay" actions={addDebtSheet} />
      <DebtSummary debts={debts} summary={summary} />
      <DebtsView
        initialSelectedDebtId={selectedDebtId}
        contacts={contacts}
        debts={debts}
        accounts={accounts}
        onChangeDebt={async (debtId, values) => {
          if (values === null) {
            const debt = debts.find((item) => item.id === debtId)
            scheduleUndoableDelete({
              key: `debt:${debtId}`,
              title: `Sắp xoá khoản nợ${debt?.note ? ` “${debt.note}”` : ""}`,
              description:
                "Khoản nợ, lịch sử thanh toán và tác động số dư sẽ bị xoá sau 6 giây.",
              pendingMessage: "Đang xoá khoản nợ…",
              successMessage: "Đã xoá khoản nợ và hoàn lại ảnh hưởng lên số dư.",
              undoMessage: "Đã giữ lại khoản nợ.",
              errorMessage: "Không thể xoá khoản nợ.",
              onCommit: () =>
                execute(
                  JSON.stringify(["change-debt", debtId, null]),
                  (operationId) =>
                    changeDebtAction(debtId, null, operationId),
                ),
            })
            return
          }

          await execute(JSON.stringify(["change-debt", debtId, values]), (operationId) => changeDebtAction(debtId, values, operationId))
          toast.success(values.recordingMode === "opening" ? "Đã cập nhật khoản nợ có sẵn. Số dư tài khoản giữ nguyên." : "Đã cập nhật khoản nợ và số dư.")
        }}
        onRecordPayment={(id, values) => changePayment(id, undefined, values)}
        onEditPayment={(id, paymentId, values) => changePayment(id, paymentId, values)}
        onDeletePayment={(id, paymentId) => changePayment(id, paymentId, null)}
        onOpenContacts={() => setContactsOpen(true)}
        emptyAction={addDebtSheet}
      />
      <ContactsSheet
        open={contactsOpen}
        onOpenChange={setContactsOpen}
        contacts={contacts}
        debts={debts}
        onAdd={addContact}
        onEdit={editContact}
        onDelete={deleteContact}
      />
      {/* On mobile the action floats above the bottom nav so it stays within
          thumb reach. */}
      <div className="pointer-events-none sticky bottom-4 z-20 flex justify-end md:hidden">
        <div className="pointer-events-auto">{addDebtSheet}</div>
      </div>
    </Page>
  )
}
