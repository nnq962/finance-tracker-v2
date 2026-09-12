import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { CurrencyInput } from "@/components/forms/currency-input"

export function SharedTransactionFields() {
  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="transaction-amount">Số tiền</FieldLabel>
          <CurrencyInput id="transaction-amount" name="amount" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="transaction-title">Tên giao dịch</FieldLabel>
          <Input
            id="transaction-title"
            name="title"
            placeholder="Ví dụ: Ăn trưa"
            required
          />
        </Field>
      </div>

      <DateTimeFields idPrefix="transaction" required />

      <Field>
        <FieldLabel htmlFor="transaction-note">Ghi chú</FieldLabel>
        <Textarea
          id="transaction-note"
          name="note"
          placeholder="Thêm ghi chú cho giao dịch..."
        />
      </Field>
    </FieldGroup>
  )
}
