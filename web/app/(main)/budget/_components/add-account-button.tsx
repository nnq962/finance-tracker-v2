import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { AddAccountSheet } from "./add-account/add-account-sheet"

/**
 * The header's "Thêm tài khoản" (md and up). On phones an account is added
 * from the last row of "Tài khoản chính" instead (2026-10-14; the floating
 * button above the tab bar is gone).
 */
export function AddAccountButton() {
  return (
    <AddAccountSheet
      trigger={
        <Button type="button">
          <PlusIcon />
          Thêm tài khoản
        </Button>
      }
    />
  )
}
