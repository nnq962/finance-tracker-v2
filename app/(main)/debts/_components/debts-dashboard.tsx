"use client"

import * as React from "react"
import type { Account } from "@/lib/accounts/types"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createContactAction, updateContactAction, deleteContactAction, createDebtAction, saveDebtPaymentAction, changeDebtAction } from "../actions"
import { getDebtSummary } from "../_lib/get-debt-summary"
import type {
  Contact,
  Debt,
  NewDebt,
  NewContact,
  NewDebtPayment,
} from "../_types/debt"
import { AddDebtSheet } from "./add-debt-sheet"
import { ContactsView } from "./contacts-view"
import { DebtSummary } from "./debt-summary"
import { DebtsHeader } from "./debts-header"
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

  // Keep the same request ID after a lost response; successful requests release it.
  async function execute<T>(key: string, action: (operationId: string) => Promise<{ success: true; data: T } | { success: false; error: string }>) {
    const operationId = operations.current.get(key) ?? crypto.randomUUID()
    operations.current.set(key, operationId)
    const result = await action(operationId)
    if (!result.success) throw new Error(result.error)
    operations.current.delete(key)
    router.refresh()
  }

  const addContact = async (values: NewContact) => {
    await execute(JSON.stringify(["contact", values]), (id) => createContactAction(values, id))
    toast.success("Đã thêm người liên hệ.")
  }
  const editContact = async (id: string, values: NewContact) => {
    await execute(JSON.stringify(["contact", id, values]), () => updateContactAction(id, values))
    toast.success("Đã cập nhật người liên hệ.")
  }
  const deleteContact = async (id: string) => {
    await execute(`delete-contact-${id}`, () => deleteContactAction(id))
    toast.success("Đã xoá người liên hệ.")
  }
  const addDebt = async (values: NewDebt) => {
    await execute(JSON.stringify(["debt", values]), (id) => createDebtAction(values, id))
    toast.success("Đã tạo khoản nợ và cập nhật số dư.")
  }
  const changePayment = async (debtId: string, paymentId: string | undefined, values: NewDebtPayment | null) => {
    await execute(JSON.stringify(["payment", debtId, paymentId, values]), (id) => saveDebtPaymentAction(debtId, paymentId, values, id))
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-24">
      <DebtsHeader
        actions={
          <AddDebtSheet accounts={accounts} contacts={contacts} onAddDebt={addDebt} />
        }
      />
      <DebtSummary summary={summary} />
      <ContactsView contacts={contacts} debts={debts} onAdd={addContact} onEdit={editContact} onDelete={deleteContact} />
      <DebtsView
        key={selectedDebtId}
        initialSelectedDebtId={selectedDebtId}
        contacts={contacts}
        debts={debts}
        accounts={accounts}
        onChangeDebt={async (debtId, values) => {
          await execute(JSON.stringify(["change-debt", debtId, values]), (operationId) => changeDebtAction(debtId, values, operationId))
          toast.success(values ? "Đã cập nhật khoản nợ và số dư." : "Đã xoá khoản nợ và hoàn lại ảnh hưởng lên số dư.")
        }}
        onRecordPayment={(id, values) => changePayment(id, undefined, values)}
        onEditPayment={(id, paymentId, values) => changePayment(id, paymentId, values)}
        onDeletePayment={(id, paymentId) => changePayment(id, paymentId, null)}
      />
    </div>
  )
}
