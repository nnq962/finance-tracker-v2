import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import {
  getDebtDeadlineBadge,
  getDebtMetrics,
} from "../_lib/debt-presentation"
import type { Contact, Debt } from "../_types/debt"

type DebtListItemProps = {
  contact: Contact
  debt: Debt
  selected: boolean
  onSelect: () => void
}

export function DebtListItem({
  contact,
  debt,
  selected,
  onSelect,
}: DebtListItemProps) {
  const { remainingAmount, paymentProgress, totalAmount } = getDebtMetrics(debt)
  const isSettled = debt.status === "settled" || remainingAmount <= 0
  const deadline = getDebtDeadlineBadge(debt)
  const isLent = debt.direction === "lent"
  const DirectionIcon = isLent ? ArrowUpRightIcon : ArrowDownLeftIcon
  const progressLabel = `${isLent ? "Đã thu" : "Đã trả"} ${Math.round(paymentProgress)}%`

  return (
    <Card
      pressable
      asChild
      className={cn(
        "w-full gap-3 px-(--card-spacing) text-left",
        // Selection only shows where the detail panel sits beside the list.
        selected &&
          "xl:[--button-face:#d6f4ff] xl:[--button-shade:#82c7f0] xl:hover:[--button-face:#d6f4ff] dark:xl:[--button-face:#113950] dark:xl:[--button-shade:#207aaa] dark:xl:hover:[--button-face:#113950]",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        aria-label={`${contact.name}, ${isLent ? "cho vay" : "đi vay"}${debt.note ? `, ${debt.note}` : ""}, còn lại ${formatCurrency(remainingAmount, { signDisplay: "never" })}, ${isSettled ? "đã tất toán" : deadline.label}, ${progressLabel}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <Avatar size="lg">
            <AvatarFallback>{contact.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-baseline justify-between gap-3">
              <p className="truncate font-heading text-base font-extrabold">
                {contact.name}
              </p>
              <p
                className={cn(
                  "shrink-0 font-heading text-base font-extrabold tabular-nums",
                  isSettled && "text-muted-foreground",
                )}
              >
                {formatCurrency(remainingAmount, { signDisplay: "never" })}
              </p>
            </div>
            <div className="flex min-w-0 items-baseline justify-between gap-3 text-xs text-muted-foreground">
              <p className="truncate">{debt.note || "Không có ghi chú"}</p>
              <p className="shrink-0 tabular-nums">
                / {formatCurrency(totalAmount, { signDisplay: "never" })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pl-[3.25rem]">
          <Badge variant={isLent ? "default" : "destructive"}>
            <DirectionIcon aria-hidden="true" />
            {isLent ? "Cho vay" : "Đi vay"}
          </Badge>
          {isSettled ? (
            <Badge variant="outline">
              <CheckIcon aria-hidden="true" />
              Đã tất toán
            </Badge>
          ) : (
            <Badge variant={deadline.variant}>{deadline.label}</Badge>
          )}
          {debt.recordingMode === "opening" ? (
            <Badge variant="outline">Nợ có sẵn</Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-3 pl-[3.25rem]" aria-hidden="true">
          <Progress value={paymentProgress} tone={isLent ? "leaf" : "coral"} />
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {Math.round(paymentProgress)}%
          </span>
        </div>
      </button>
    </Card>
  )
}
