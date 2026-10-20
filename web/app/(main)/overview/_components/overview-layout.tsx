import type * as React from "react"

type OverviewLayoutProps = {
  netWorth: React.ReactNode
  /** The new user's missions, with Pro at their end; Pro's banner once every reward is in. */
  missions?: React.ReactNode
  /** This month's spending limits; empty while none is set. */
  budgets?: React.ReactNode
  calendar: React.ReactNode
  /** Debts coming due; left out when there are none. */
  dueDebts?: React.ReactNode
  /** One of them overdue or due within three days: they come right under net worth. */
  dueDebtsUrgent?: boolean
  allocation: React.ReactNode
  trend: React.ReactNode
}

/**
 * The overview's sections, shared with its loading state, in the order of
 * "how am I doing" then "what needs me" (2026-10-20): net worth, debts due
 * soon when one is late or close, spending limits, categories, the calendar,
 * the six months, the new user's missions, and debts not yet pressing last.
 * Below lg they stack in one column. From lg net worth runs across the top
 * and two columns follow: the lists on the left (24rem wide from xl), the
 * calendar and the trend chart, which read better wide, on the right. A slot
 * whose content renders nothing (missions all claimed, Pro already) leaves no gap.
 */
export function OverviewLayout({
  netWorth,
  missions,
  budgets,
  calendar,
  dueDebts,
  dueDebtsUrgent = false,
  allocation,
  trend,
}: OverviewLayoutProps) {
  // Below lg the two columns dissolve (`contents`) and `order` interleaves
  // their sections; inside a column the same order values keep their sequence.
  const columnClassName = "contents min-w-0 lg:flex lg:flex-col lg:gap-8"

  return (
    <div className="flex min-w-0 flex-col gap-6 md:gap-8 lg:grid lg:grid-cols-2 lg:items-start xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <div className="order-1 lg:order-first lg:col-span-2">{netWorth}</div>
      <div className={columnClassName}>
        {dueDebts ? <div className={dueDebtsUrgent ? "order-2" : "order-8"}>{dueDebts}</div> : null}
        {budgets ? <div className="order-3 empty:hidden">{budgets}</div> : null}
        <div className="order-4">{allocation}</div>
        {missions ? <div className="order-7 empty:hidden">{missions}</div> : null}
      </div>
      <div className={columnClassName}>
        <div className="order-5">{calendar}</div>
        <div className="order-6">{trend}</div>
      </div>
    </div>
  )
}
