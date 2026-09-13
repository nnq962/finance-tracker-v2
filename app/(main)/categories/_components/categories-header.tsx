import { Separator } from "@/components/ui/separator"

export function CategoriesHeader() {
  return (
    <header className="space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Hạng mục thu & chi
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Tạo, sắp xếp và quản lý các hạng mục cho từng dòng tiền.
        </p>
      </div>
      <Separator />
    </header>
  )
}
