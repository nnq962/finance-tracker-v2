"use client"

import { useState } from "react"

import { CurrencyInput } from "@/components/forms/currency-input"
import { formatCurrency } from "@/lib/format-currency"

export function CurrencyInputExample() {
  const [amount, setAmount] = useState<number | null>(1500000)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="grid content-start gap-2">
        <label htmlFor="lab-currency-empty" className="text-sm font-semibold">Nhập số tiền</label>
        <CurrencyInput id="lab-currency-empty" name="example-empty-amount" placeholder="Nhập số tiền" />
        <p className="text-xs text-muted-foreground">Thử nhập 1500000 để xem định dạng 1.500.000 đ.</p>
      </div>
      <div className="grid content-start gap-2">
        <label htmlFor="lab-currency-filled" className="text-sm font-semibold">Có dữ liệu</label>
        <CurrencyInput id="lab-currency-filled" name="example-filled-amount" value={amount} onValueChange={setAmount} />
        <p className="text-sm text-muted-foreground">
          Số tiền: <span className="tabular-nums text-foreground">{amount === null ? "Chưa nhập" : formatCurrency(amount)}</span>
        </p>
      </div>
    </div>
  )
}
