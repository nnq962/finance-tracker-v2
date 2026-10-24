"use client"

import * as React from "react"
import { BanknoteIcon, LandmarkIcon, PiggyBankIcon, PlusIcon, WalletIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import type { AccountType } from "@/lib/accounts/types"

import { AddAccountSheet } from "./add-account/add-account-sheet"
import { JarFormSheet } from "./savings/jar-form-sheet"

type Kind = Exclude<AccountType, "savings"> | "jar"

const accountKinds = [
  { kind: "cash", icon: BanknoteIcon, title: "Tiền mặt", description: "Tiền trong ví, trong két" },
  { kind: "bank", icon: LandmarkIcon, title: "Ngân hàng", description: "Tài khoản thanh toán" },
  { kind: "e-wallet", icon: WalletIcon, title: "Ví điện tử", description: "MoMo, ZaloPay, ShopeePay…" },
] as const

/**
 * The one way to add on Tài khoản (2026-10-24, the user's ask; the lists'
 * "Thêm tài khoản" and "Thêm hũ" went): the + in the page's bar (the top bar
 * from md) opens a short sheet of what can be added, the kinds as the page's
 * kind tiles show them (a jar on its lime tile, apart). A pick closes it, and
 * once it has slid away the usual sheet for that kind opens: the account form
 * on that type, or a new jar.
 */
export function AddAccountButton() {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [adding, setAdding] = React.useState<Kind | null>(null)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  // The last type the account form opened on, kept while it slides away.
  const [formType, setFormType] = React.useState<Exclude<AccountType, "savings">>("cash")

  // The menu slides away first: the next sheet comes up as it is nearly gone (350ms of vaul's
  // 500, its ease all but done), at once under reduced motion, where sheets do not slide.
  // (vaul's onAnimationEnd only follows closes of its own: a drag, a tap outside.)
  const pick = (kind: Kind) => {
    setMenuOpen(false)
    if (kind !== "jar") setFormType(kind)
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAdding(kind), still ? 0 : 350)
  }

  return (
    <>
      <Button type="button" variant="elevated" size="icon" aria-label="Thêm tài khoản hoặc hũ" onClick={() => setMenuOpen(true)}>
        <PlusIcon />
      </Button>
      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerContent surface="grouped">
          <DrawerHeader>
            <DrawerTitle>Thêm mới</DrawerTitle>
            <DrawerDescription className="sr-only">Chọn loại tài khoản hoặc một hũ tiết kiệm</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-4">
            <SettingsGroup>
              {accountKinds.map(({ kind, icon, title, description }) => (
                <SettingsRow key={kind} icon={icon} tone="neutral" title={title} description={description} onClick={() => pick(kind)} />
              ))}
            </SettingsGroup>
            <SettingsGroup>
              <SettingsRow icon={PiggyBankIcon} tone="accent" title="Hũ tiết kiệm" description="Để dành cho một món, một mục tiêu" onClick={() => pick("jar")} />
            </SettingsGroup>
          </div>
        </DrawerContent>
      </Drawer>
      <AddAccountSheet
        initialType={formType}
        open={adding !== null && adding !== "jar"}
        onOpenChange={(open) => !open && setAdding(null)}
      />
      <JarFormSheet open={adding === "jar"} onOpenChange={(open) => !open && setAdding(null)} />
    </>
  )
}
