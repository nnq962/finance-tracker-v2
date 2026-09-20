import {
  CheckIcon,
  Clock3Icon,
  PencilIcon,
  PhoneIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/format-currency"

import {
  formatDebtDate,
  getDebtDeadline,
  getDebtMetrics,
} from "../_lib/debt-presentation"
import type { Contact, Debt, NewDebtPayment } from "../_types/debt"
import { RecordDebtPaymentSheet } from "./record-debt-payment-sheet"

type DebtDetailPanelProps = {
  contact: Contact
  debt: Debt
  onRecordPayment: (payment: NewDebtPayment) => void
}

export function DebtDetailPanel({
  contact,
  debt,
  onRecordPayment,
}: DebtDetailPanelProps) {
  const { paidAmount, remainingAmount, paymentProgress } = getDebtMetrics(debt)
  const deadline = getDebtDeadline(debt)
  const paymentAction = debt.direction === "lent" ? "Ghi nhận thu" : "Ghi nhận trả"

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="h-16 content-center">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{contact.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle>{contact.name}</CardTitle>
            {contact.phone ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <PhoneIcon className="size-3.5" />
                {contact.phone}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-5 py-4">
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={debt.direction === "lent" ? "secondary" : "destructive"}
            className={
              debt.direction === "lent"
                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                : undefined
            }
          >
            {debt.direction === "lent" ? "Cho vay" : "Đi vay"}
          </Badge>
          <Badge variant={deadline.isOverdue ? "destructive" : "outline"}>
            {deadline.label}
          </Badge>
        </div>

        <div>
          <p className="font-semibold">{debt.note}</p>
        </div>

        <div className="space-y-3 rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Tổng khoản</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(debt.amount, { signDisplay: "never" })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              {debt.direction === "lent" ? "Đã thu" : "Đã trả"}
            </span>
            <span className="font-medium tabular-nums">
              {formatCurrency(paidAmount, { signDisplay: "never" })}
            </span>
          </div>
          <Separator />
          <div className="flex items-end justify-between gap-4">
            <span className="text-sm text-muted-foreground">Còn lại</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(remainingAmount, { signDisplay: "never" })}
            </span>
          </div>
          <Progress value={paymentProgress} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Ngày ghi</p>
            <p className="font-medium">{formatDebtDate(debt.recordedAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Hẹn trả</p>
            <p className={deadline.isOverdue ? "font-medium text-destructive" : "font-medium"}>
              {debt.dueAt ? formatDebtDate(debt.dueAt) : "Không có"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Lịch sử thanh toán</p>
          {debt.payments?.length ? (
            debt.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-background">
                    <CheckIcon className="size-4" />
                  </span>
                  {formatDebtDate(payment.paidAt)}
                </span>
                <span className="font-medium tabular-nums">
                  +{formatCurrency(payment.amount, { signDisplay: "never" })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có thanh toán nào.</p>
          )}
        </div>

        <RecordDebtPaymentSheet
          contact={contact}
          debt={debt}
          onRecordPayment={onRecordPayment}
          trigger={
            <Button className="w-full">
              <CheckIcon />
              {paymentAction}
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline">
            <PencilIcon />
            Sửa
          </Button>
          <Button variant="outline">
            <Clock3Icon />
            Chi tiết
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
