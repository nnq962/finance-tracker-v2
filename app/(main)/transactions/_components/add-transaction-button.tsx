import { PlusIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"

export function AddTransactionButton() {
  return (
    <div className="fixed right-6 bottom-6 z-20">
      <Button size="lg">
        <PlusIcon />
        Thêm giao dịch
      </Button>
    </div>
  )
}
