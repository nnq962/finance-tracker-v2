"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcwIcon,
} from "lucide-react"

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/radix/tabs"
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group"

import type { TransactionPeriod } from "../_types/transaction"

type TransactionPeriodFilterProps = {
  period: TransactionPeriod
  rangeLabel: string
  contextLabel: string
  transactionCount: number
  canGoNext: boolean
  onPeriodChange: (period: TransactionPeriod) => void
  onPrevious: () => void
  onNext: () => void
  onReset: () => void
}

export function TransactionPeriodFilter({
  period,
  rangeLabel,
  contextLabel,
  transactionCount,
  canGoNext,
  onPeriodChange,
  onPrevious,
  onNext,
  onReset,
}: TransactionPeriodFilterProps) {
  return (
    <section
      className="flex w-full flex-col items-start gap-2 xl:w-auto xl:items-end"
      aria-label="Kỳ giao dịch"
    >
      <div className="flex w-full items-center gap-2 xl:w-auto">
        <Tabs
          className="shrink-0"
          value={period}
          onValueChange={(value) => onPeriodChange(value as TransactionPeriod)}
        >
          <TabsList>
            <TabsTrigger value="week">Tuần</TabsTrigger>
            <TabsTrigger value="month">Tháng</TabsTrigger>
          </TabsList>
        </Tabs>

        <ButtonGroup
          className="w-60 shrink-0"
          aria-label="Điều hướng kỳ giao dịch"
        >
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={onReset}
            aria-label="Về kỳ hiện tại"
            title="Về kỳ hiện tại"
          >
            <RotateCcwIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="border-r-0"
            onClick={onPrevious}
            aria-label={`Xem ${period === "week" ? "tuần" : "tháng"} trước`}
          >
            <ChevronLeftIcon />
          </Button>
          <ButtonGroupText className="min-w-0 flex-1 justify-center border-x-0 bg-background whitespace-nowrap dark:bg-input/30">
            {rangeLabel}
          </ButtonGroupText>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="disabled:opacity-100"
            onClick={onNext}
            disabled={!canGoNext}
            aria-label={`Xem ${period === "week" ? "tuần" : "tháng"} sau`}
          >
            <ChevronRightIcon className={canGoNext ? undefined : "opacity-50"} />
          </Button>
        </ButtonGroup>
      </div>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground sm:self-end">
        <span className="font-medium text-foreground">
          {transactionCount} giao dịch
        </span>
        <span aria-hidden="true">·</span>
        <span>{contextLabel}</span>
      </p>
    </section>
  )
}
