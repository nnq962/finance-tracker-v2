import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { AddAccountSheet } from "./add-account/add-account-sheet"

/** `fab`: the round button floating above the tab bar on phones. */
export function AddAccountButton({ fab = false }: { fab?: boolean }) {
  return (
    <AddAccountSheet
      trigger={
        fab ? (
          <Button type="button" size="fab" aria-label="Thêm tài khoản">
            <PlusIcon />
          </Button>
        ) : (
          <Button type="button">
            <PlusIcon />
            Thêm tài khoản
          </Button>
        )
      }
    />
  )
}
