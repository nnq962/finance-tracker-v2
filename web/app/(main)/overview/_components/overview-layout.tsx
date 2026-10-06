import type * as React from "react"

type OverviewLayoutProps = {
  netWorth: React.ReactNode
  calendar: React.ReactNode
  /** Debts coming due; left out when there are none. */
  dueDebts?: React.ReactNode
  allocation: React.ReactNode
  trend: React.ReactNode
}

/**
 * The overview's sections, shared with its loading state. Below lg they stack
 * in one column: net worth, calendar, due debts, allocation, trend. From lg
 * up the lists form a rail on the left (24rem wide from xl) and the calendar
 * and trend chart, which read better wide, take the rest.
 */
export function OverviewLayout({
  netWorth,
  calendar,
  dueDebts,
  allocation,
  trend,
}: OverviewLayoutProps) {
  // Below lg the two columns dissolve (`contents`) and `order` interleaves
  // their sections; inside a column the same order values keep their sequence.
  const columnClassName = "contents min-w-0 lg:flex lg:flex-col lg:gap-6"

  return (
    <div className="flex min-w-0 flex-col gap-4 md:gap-6 lg:grid lg:grid-cols-2 lg:items-start xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <div className={columnClassName}>
        <div className="order-1">{netWorth}</div>
        {dueDebts ? <div className="order-3">{dueDebts}</div> : null}
        <div className="order-4">{allocation}</div>
      </div>
      <div className={columnClassName}>
        <div className="order-2">{calendar}</div>
        <div className="order-5">{trend}</div>
      </div>
    </div>
  )
}
