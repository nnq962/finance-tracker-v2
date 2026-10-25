"use client"

import { useRouter } from "next/navigation"

import { Section } from "@/components/app/section-header"
import type { Account } from "@/lib/accounts/types"

import { JarTile } from "../../budget/_components/savings/jar-card"

/**
 * Hũ tiết kiệm on the overview (2026-10-25, the overview mockup): the jars
 * being filled, two at most, as Tài khoản shows them; a tap opens the jar
 * there, "Xem tất cả" goes there. No jar filling, no section.
 */
export function SavingsJars({ accounts, today }: { accounts: Account[]; today: string }) {
  const router = useRouter()
  const jars = accounts.filter((account) => account.type === "savings" && !account.goal?.completedAt).slice(0, 2)
  if (jars.length === 0) return null
  return (
    <Section title="Hũ tiết kiệm" href="/budget">
      <div className="grid grid-cols-2 gap-3">
        {jars.map((jar) => (
          <JarTile key={jar.id} jar={jar} today={today} onSelect={() => router.push(`/budget?account=${jar.id}`)} />
        ))}
      </div>
    </Section>
  )
}
