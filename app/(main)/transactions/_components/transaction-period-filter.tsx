"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group"

import type { TransactionPeriod } from "../_types/transaction"

type TransactionPeriodFilterProps = {
  period: TransactionPeriod
  rangeLabel: string
  canGoNext: boolean
  onPeriodChange: (period: TransactionPeriod) => void
  onPrevious: () => void
  onNext: () => void
}

export function TransactionPeriodFilter({
  period,
  rangeLabel,
  canGoNext,
  onPeriodChange,
  onPrevious,
  onNext,
}: TransactionPeriodFilterProps) {
  return (
    <div
      className="flex shrink-0 items-center gap-2"
      aria-label="Kỳ giao dịch"
    >
      <Tabs
        value={period}
        onValueChange={(value) => onPeriodChange(value as TransactionPeriod)}
      >
        <TabsList>
          <TabsTrigger value="week">Tuần</TabsTrigger>
          <TabsTrigger value="month">Tháng</TabsTrigger>
        </TabsList>
      </Tabs>

      <ButtonGroup
        className="w-48 shrink-0"
        aria-label="Điều hướng kỳ giao dịch"
      >
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={onPrevious}
          aria-label={`Xem ${period === "week" ? "tuần" : "tháng"} trước`}
        >
          <ChevronLeftIcon />
        </Button>
        <ButtonGroupText className="min-w-0 flex-1 justify-center bg-background whitespace-nowrap dark:bg-input/30">
          {rangeLabel}
        </ButtonGroupText>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label={`Xem ${period === "week" ? "tuần" : "tháng"} sau`}
        >
          <ChevronRightIcon />
        </Button>
      </ButtonGroup>
    </div>
  )
}
