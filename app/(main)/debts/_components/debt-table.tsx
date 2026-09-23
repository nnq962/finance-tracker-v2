"use client"

import * as React from "react"
import {
  ArrowDownIcon,
  ArrowDownLeftIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/format-currency"

import {
  formatDebtDate,
  getDebtDeadline,
  getDebtMetrics,
} from "../_lib/debt-presentation"
import type { Contact, Debt } from "../_types/debt"

type DebtTableProps = {
  contacts: Map<string, Contact>
  debts: Debt[]
  onSelect: (debtId: string) => void
  selectedDebtId?: string
}

export function DebtTable({
  contacts,
  debts,
  onSelect,
  selectedDebtId,
}: DebtTableProps) {
  const [dueDateOrder, setDueDateOrder] = React.useState<"asc" | "desc">("asc")
  const sortedDebts = React.useMemo(
    () =>
      [...debts].sort((left, right) => {
        if (!left.dueAt && !right.dueAt) return 0
        if (!left.dueAt) return 1
        if (!right.dueAt) return -1

        return dueDateOrder === "asc"
          ? left.dueAt.localeCompare(right.dueAt)
          : right.dueAt.localeCompare(left.dueAt)
      }),
    [debts, dueDateOrder],
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-64">Người & khoản</TableHead>
          <TableHead>Loại</TableHead>
          <TableHead className="text-right">Còn lại</TableHead>
          <TableHead className="min-w-44">Tiến độ</TableHead>
          <TableHead aria-sort={dueDateOrder === "asc" ? "ascending" : "descending"}>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDueDateOrder((current) => current === "asc" ? "desc" : "asc")
                }
                aria-label={`Sắp xếp hạn trả ${dueDateOrder === "asc" ? "giảm dần" : "tăng dần"}`}
              >
                Hạn trả
                {dueDateOrder === "asc" ? <ArrowUpIcon /> : <ArrowDownIcon />}
              </Button>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedDebts.map((debt) => {
          const contact = contacts.get(debt.contactId)

          if (!contact) return null

          const { remainingAmount, paymentProgress, totalAmount } = getDebtMetrics(debt)
          const deadline = getDebtDeadline(debt)

          return (
            <TableRow
              key={debt.id}
              data-state={selectedDebtId === debt.id ? "selected" : undefined}
              className="cursor-pointer"
              onClick={() => onSelect(debt.id)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{contact.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{contact.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {debt.note}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={debt.direction === "lent" ? "secondary" : "destructive"}
                  className={
                    debt.direction === "lent"
                      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : undefined
                  }
                >
                  {debt.direction === "lent" ? (
                    <ArrowUpRightIcon />
                  ) : (
                    <ArrowDownLeftIcon />
                  )}
                  {debt.direction === "lent" ? "Cho vay" : "Đi vay"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <p className="font-semibold tabular-nums">
                  {formatCurrency(remainingAmount, { signDisplay: "never" })}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  / {formatCurrency(totalAmount, { signDisplay: "never" })}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Progress value={paymentProgress} />
                  <span className="w-9 text-right text-sm text-muted-foreground tabular-nums">
                    {Math.round(paymentProgress)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <p className={deadline.isOverdue ? "font-medium text-destructive" : "font-medium"}>
                  {deadline.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {debt.dueAt ? formatDebtDate(debt.dueAt) : "—"}
                </p>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
