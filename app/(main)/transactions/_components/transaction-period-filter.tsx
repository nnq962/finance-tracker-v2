"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group"

type TransactionPeriodFilterProps = {
  rangeLabel: string
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
}

export function TransactionPeriodFilter({
  rangeLabel,
  canGoNext,
  onPrevious,
  onNext,
}: TransactionPeriodFilterProps) {
  return (
    <div
      className="flex shrink-0 items-center"
      aria-label="Tháng giao dịch"
    >
      <ButtonGroup
        className="w-48 shrink-0"
        aria-label="Điều hướng tháng giao dịch"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onPrevious}
          aria-label="Xem tháng trước"
        >
          <ChevronLeftIcon />
        </Button>
        <ButtonGroupText className="min-w-0 flex-1 justify-center whitespace-nowrap border-2 border-[#e7e4dd] bg-[#f3f1ec] text-[#2b2a33] dark:border-[#35323e] dark:bg-[#1b1a21] dark:text-[#f2f0f6]">
          {rangeLabel}
        </ButtonGroupText>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Xem tháng sau"
        >
          <ChevronRightIcon />
        </Button>
      </ButtonGroup>
    </div>
  )
}
