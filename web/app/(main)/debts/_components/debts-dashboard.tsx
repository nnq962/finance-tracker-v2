"use client"

import * as React from "react"
import { BookUserIcon, PlusIcon } from "lucide-react"

import { Page, PageHeader } from "@/components/page"
import { FloatingActions } from "@/components/app/floating-actions"
import { Button } from "@/components/ui/button"
import type { Account } from "@/lib/accounts/types"

import { toast } from "sonner"
import { createContactAction, updateContactAction, deleteContactAction, createDebtAction, saveDebtPaymentAction, changeDebtAction } from "../actions"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"
import type {
  Contact,
  Debt,
  NewDebt,
  NewContact,
  NewDebtPayment,
} from "../_types/debt"

import { getDebtMetrics } from "../_lib/debt-presentation"
import { AddDebtSheet } from "./add-debt-sheet"
import { ContactsSheet } from "./contacts-sheet"
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
  const contacts = initialContacts
  const debts = initialDebts
  const operations = React.useRef(new Map<string, string>())
  const [contactsOpen, setContactsOpen] = React.useState(false)

  // Keep the same request ID after a lost response; successful requests release it.
  async function execute<T>(key: string, action: (operationId: string) => Promise<{ success: true; data: T } | { success: false; error: string }>) {
    const operationId = operations.current.get(key) ?? crypto.randomUUID()
    operations.current.set(key, operationId)
    const result = await action(operationId)
    if (!result.success) throw new Error(result.error)
    operations.current.delete(key)
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
      title: `Đã xoá “${contact?.name ?? "người liên hệ"}”`,
      pendingMessage: "Đang xoá người liên hệ…",
      undoMessage: "Đã giữ lại người liên hệ.",
      errorMessage: "Không thể xoá người liên hệ.",
      onCommit: () =>
        execute(`delete-contact-${id}`, () => deleteContactAction(id)),
    })
  }
  const addDebt = async (values: NewDebt) => {
    await execute(JSON.stringify(["debt", values]), (id) => createDebtAction(values, id))
    toast.success("Đã thêm khoản nợ")
  }
  const changePayment = async (debtId: string, paymentId: string | undefined, values: NewDebtPayment | null) => {
    if (values === null && paymentId) {
      scheduleUndoableDelete({
        key: `debt-payment:${debtId}:${paymentId}`,
        title: "Đã xoá lần thanh toán",
        pendingMessage: "Đang xoá lần thanh toán…",
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

  const addDebtSheet = (trigger?: React.ReactNode) => (
    <AddDebtSheet accounts={accounts} contacts={contacts} onAddDebt={addDebt} onAddContact={addContact} trigger={trigger} />
  )
  const contactsLabel = `Người liên hệ, ${contacts.length} người`
  const openCount = debts.filter((debt) => debt.status !== "settled" && getDebtMetrics(debt).remainingAmount > 0).length

  return (
    <Page>
      <PageHeader
        eyebrow={openCount > 0 ? `${openCount} khoản đang mở` : "Cho vay và đi vay"}
        title="Vay nợ"
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setContactsOpen(true)}>
              <BookUserIcon />
              Người liên hệ
            </Button>
            {addDebtSheet()}
          </>
        }
        accessory={
          <Button type="button" variant="secondary" size="icon" aria-label={contactsLabel} onClick={() => setContactsOpen(true)}>
            <BookUserIcon />
          </Button>
        }
      />
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
              title: `Đã xoá khoản nợ${debt?.note ? ` “${debt.note}”` : ""}`,
              pendingMessage: "Đang xoá khoản nợ…",
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
          toast.success("Đã cập nhật khoản nợ")
        }}
        onRecordPayment={(id, values) => changePayment(id, undefined, values)}
        onEditPayment={(id, paymentId, values) => changePayment(id, paymentId, values)}
        onDeletePayment={(id, paymentId) => changePayment(id, paymentId, null)}
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
      <FloatingActions>
        {addDebtSheet(
          <Button type="button" size="fab" aria-label="Thêm khoản nợ">
            <PlusIcon />
          </Button>,
        )}
      </FloatingActions>
    </Page>
  )
}
