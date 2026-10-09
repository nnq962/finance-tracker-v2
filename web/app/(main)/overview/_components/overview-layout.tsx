import type * as React from "react"

type OverviewLayoutProps = {
  netWorth: React.ReactNode
  /** The new user's missions, with Pro at their end; Pro's banner once every reward is in. */
  missions?: React.ReactNode
  calendar: React.ReactNode
  /** Debts coming due; left out when there are none. */
  dueDebts?: React.ReactNode
  allocation: React.ReactNode
  trend: React.ReactNode
}

/**
 * The overview's sections, shared with its loading state. Below lg they stack
 * in one column: net worth (the page's dark lead card), missions (or, once
 * they are done, the Pro invitation), calendar, allocation, trend, and due
 * debts last. From lg up the lists form a rail on the left
 * (24rem wide from xl) and the calendar and trend chart, which read better
 * wide, take the rest. A slot whose content renders nothing
 * (missions all claimed, Pro already) leaves no gap.
 */
export function OverviewLayout({
  netWorth,
  missions,
  calendar,
  dueDebts,
  allocation,
  trend,
}: OverviewLayoutProps) {
  // Below lg the two columns dissolve (`contents`) and `order` interleaves
  // their sections; inside a column the same order values keep their sequence.
  const columnClassName = "contents min-w-0 lg:flex lg:flex-col lg:gap-8"

  return (
    <div className="flex min-w-0 flex-col gap-6 md:gap-8 lg:grid lg:grid-cols-2 lg:items-start xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <div className={columnClassName}>
        <div className="order-1">{netWorth}</div>
        {missions ? <div className="order-2 empty:hidden">{missions}</div> : null}
        <div className="order-5">{allocation}</div>
        {dueDebts ? <div className="order-7">{dueDebts}</div> : null}
      </div>
      <div className={columnClassName}>
        <div className="order-4">{calendar}</div>
        <div className="order-6">{trend}</div>
      </div>
    </div>
  )
}
