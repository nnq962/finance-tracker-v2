import type * as React from "react"

type OverviewLayoutProps = {
  netWorth: React.ReactNode
  /** This month's spending against the same days of last month. */
  versus?: React.ReactNode
  /** The last few transactions; empty with none yet. */
  recent?: React.ReactNode
  /** The jars being filled; empty with none. */
  jars?: React.ReactNode
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
 * "how am I doing" then "what needs me" (2026-10-20; 2026-10-25 the mockup's
 * additions): net worth, the new user's AI missions (second since 2026-10-25),
 * this month against last, debts due soon when one is late or close, the last
 * transactions, spending limits, the jars, categories, the calendar, the six
 * months, and debts not yet pressing last.
 * Below lg they stack in one column. From lg net worth runs across the top
 * and two columns follow: the lists on the left (24rem wide from xl), the
 * charts, which read better wide, on the right: this month, the calendar, the
 * six months and the categories (2026-10-25, the user's pick A of a mockup:
 * the categories moved over from the left, so the two columns end near each
 * other; the jars stay left, moving them too left the right far longer). A slot
 * whose content renders nothing (missions all claimed, Pro already) leaves no gap.
 */
export function OverviewLayout({
  netWorth,
  versus,
  recent,
  jars,
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
    // The group lets the versus card take its title inside while the missions card, which
    // has none above it, heads the left column (see VersusLastMonth).
    <div className="group/overview flex min-w-0 flex-col gap-6 md:gap-8 lg:grid lg:grid-cols-2 lg:items-start xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <div className="order-1 lg:order-first lg:col-span-2">{netWorth}</div>
      <div className={columnClassName}>
        {/* The AI missions right under net worth (2026-10-25, the user's ask; last before). */}
        {missions ? <div data-overview-missions className="order-2 empty:hidden">{missions}</div> : null}
        {dueDebts ? <div className={dueDebtsUrgent ? "order-4" : "order-11"}>{dueDebts}</div> : null}
        {recent ? <div className="order-5 empty:hidden">{recent}</div> : null}
        {budgets ? <div className="order-6 empty:hidden">{budgets}</div> : null}
        {jars ? <div className="order-7 empty:hidden">{jars}</div> : null}
      </div>
      <div className={columnClassName}>
        {/* lg:order sorts this column: this month, the calendar, the six months, the categories. */}
        {versus ? <div className="order-3 lg:order-1">{versus}</div> : null}
        <div className="order-9 lg:order-2">{calendar}</div>
        <div className="order-10 lg:order-3">{trend}</div>
        <div className="order-8 lg:order-4">{allocation}</div>
      </div>
    </div>
  )
}
