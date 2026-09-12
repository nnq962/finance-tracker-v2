import { PlusIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"

import { AddAccountSheet } from "./add-account/add-account-sheet"

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
