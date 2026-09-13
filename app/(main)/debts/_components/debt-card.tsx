import { CalendarClockIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/format-currency"

import type { Contact, Debt } from "../_types/debt"

const dateFormatter = new Intl.DateTimeFormat("vi-VN")

function getDaysUntilDue(dueAt: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDate = new Date(`${dueAt}T00:00:00`)

  return Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)
}

function getDeadlineStatus(debt: Debt, remainingAmount: number) {
  if (debt.status === "settled" || remainingAmount === 0) {
    return {
      label: "Đã tất toán",
      variant: "secondary" as const,
      dotClassName: "bg-muted-foreground",
    }
  }

  if (!debt.dueAt) {
    return {
      label: "Không có hạn trả",
      variant: "secondary" as const,
      dotClassName: "bg-muted-foreground",
    }
  }

  const daysUntilDue = getDaysUntilDue(debt.dueAt)

  if (debt.status === "overdue" || daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue)
    return {
      label: `Quá hạn ${overdueDays} ngày`,
      variant: "destructive" as const,
      dotClassName: "bg-rose-500",
    }
  }

  if (daysUntilDue === 0) {
    return {
      label: "Đến hạn hôm nay",
      variant: "destructive" as const,
      dotClassName: "bg-rose-500",
    }
  }

  if (daysUntilDue <= 6) {
    return {
      label: `Còn ${daysUntilDue} ngày`,
      variant: "outline" as const,
      dotClassName: "bg-orange-500",
    }
  }

  if (daysUntilDue <= 14) {
    return {
      label: `Sắp đến hạn · ${daysUntilDue} ngày`,
      variant: "outline" as const,
      dotClassName: "bg-amber-500",
    }
  }

  return {
    label: `Còn ${daysUntilDue} ngày`,
    variant: "outline" as const,
    dotClassName: "bg-emerald-500",
  }
}

type DebtCardProps = {
  contact: Contact
  debt: Debt
}

export function DebtCard({ contact, debt }: DebtCardProps) {
  const paidAmount = Math.min(Math.max(debt.paidAmount, 0), debt.amount)
  const remainingAmount = Math.max(debt.amount - paidAmount, 0)
  const paymentProgress = debt.amount > 0 ? (paidAmount / debt.amount) * 100 : 0
  const paymentLabel = debt.direction === "lent" ? "Đã thu" : "Đã trả"
  const deadlineStatus = getDeadlineStatus(debt, remainingAmount)
  const directionTone =
    debt.direction === "lent"
      ? {
          markerClassName: "bg-emerald-500",
          amountClassName: "text-emerald-600 dark:text-emerald-400",
        }
      : {
          markerClassName: "bg-rose-500",
          amountClassName: "text-rose-600 dark:text-rose-400",
        }

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row flex-wrap items-center gap-3">
        <span
          aria-hidden="true"
          className={`h-12 w-1 shrink-0 rounded-full ${directionTone.markerClassName}`}
        />
        <Avatar size="lg">
          <AvatarFallback>{contact.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{contact.name}</CardTitle>
            <Badge variant={debt.direction === "lent" ? "secondary" : "destructive"}>
              {debt.direction === "lent" ? "Cho vay" : "Đi vay"}
            </Badge>
            <Badge variant={deadlineStatus.variant}>
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${deadlineStatus.dotClassName}`}
              />
              {deadlineStatus.label}
            </Badge>
          </div>
          <CardDescription className="mt-1">{debt.note}</CardDescription>
        </div>
        <div className="w-full pl-14 sm:w-auto sm:pl-0 sm:text-right">
          <p className={`font-semibold tabular-nums ${directionTone.amountClassName}`}>
            {formatCurrency(debt.amount, { signDisplay: "never" })}
          </p>
          <p className="text-xs text-muted-foreground">Tổng khoản nợ</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">
              {paymentLabel}{" "}
              <strong className="font-medium text-foreground tabular-nums">
                {formatCurrency(paidAmount, { signDisplay: "never" })}
              </strong>{" "}
              / {formatCurrency(debt.amount, { signDisplay: "never" })}
            </span>
            <span className="font-medium tabular-nums">
              Còn lại {formatCurrency(remainingAmount, { signDisplay: "never" })}
            </span>
          </div>
          <Progress
            value={paymentProgress}
            aria-label={`${paymentLabel} ${Math.round(paymentProgress)} phần trăm`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Ngày ghi {dateFormatter.format(new Date(`${debt.recordedAt}T00:00:00`))}</span>
          {debt.dueAt && (
            <span className="inline-flex items-center gap-1">
              <CalendarClockIcon className="size-3" />
              Hẹn trả {dateFormatter.format(new Date(`${debt.dueAt}T00:00:00`))}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
