import { AddTransactionSheet } from "./add-transaction/add-transaction-sheet"

export function AddTransactionButton() {
  return (
    <div className="fixed right-6 bottom-6 z-20">
      <AddTransactionSheet />
    </div>
  )
}
