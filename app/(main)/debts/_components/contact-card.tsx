import { PhoneIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"

import { getDebtSummary } from "../_lib/get-debt-summary"
import type { Contact, Debt } from "../_types/debt"

type ContactCardProps = {
  contact: Contact
  debts: Debt[]
}

export function ContactCard({ contact, debts }: ContactCardProps) {
  const summary = getDebtSummary(debts)

  return (
    <Card size="sm">
      <CardHeader className="grid grid-cols-[auto_1fr] gap-x-3">
        <Avatar size="lg" className="row-span-2">
          <AvatarFallback>{contact.initials}</AvatarFallback>
        </Avatar>
        <CardTitle>{contact.name}</CardTitle>
        <CardDescription>{contact.note || "Chưa có ghi chú"}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Số điện thoại</p>
          <p className="mt-1 inline-flex items-center gap-1 font-medium">
            <PhoneIcon className="size-3" />
            {contact.phone || "Chưa cập nhật"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Đang cho vay</p>
          <p className="mt-1 font-medium tabular-nums">{formatCurrency(summary.totalLent)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Đang đi vay</p>
          <p className="mt-1 font-medium tabular-nums">{formatCurrency(summary.totalBorrowed)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
