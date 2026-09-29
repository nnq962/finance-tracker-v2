import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const debtRows = [
  { nameWidth: "w-24", noteWidth: "w-36" },
  { nameWidth: "w-32", noteWidth: "w-28" },
  { nameWidth: "w-28", noteWidth: "w-40" },
  { nameWidth: "w-20", noteWidth: "w-32" },
]

function SummarySkeleton() {
  return (
    <Card>
      <CardHeader className="grid grid-cols-[1fr_auto] items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="size-2 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-32 max-w-full" />
        </div>
        <Skeleton className="size-9 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-36 max-w-full" />
        <Skeleton className="mt-1 h-4 w-28 max-w-full" />
      </CardContent>
    </Card>
  )
}

function ContactSkeleton() {
  return (
    <Card size="sm">
      <CardContent>
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-5 w-28 max-w-full" />
            <Skeleton className="h-5 w-24 max-w-full" />
          </div>
          <Skeleton className="size-7 shrink-0 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

function DebtTableSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-3 border-b px-4 py-3 lg:h-16 lg:flex-row lg:items-center">
        <div className="flex h-8 w-full items-center gap-2 rounded-lg border-2 border-[#e7e4dd] bg-[#f3f1ec] px-2.5 dark:border-[#35323e] dark:bg-[#1b1a21] lg:max-w-xs">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-28 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-64">
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead>
              <Skeleton className="ml-auto h-4 w-16" />
            </TableHead>
            <TableHead className="min-w-44">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="ml-auto h-4 w-16" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {debtRows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="min-w-0 space-y-1">
                    <Skeleton
                      className={`h-5 max-w-full ${row.nameWidth}`}
                    />
                    <Skeleton
                      className={`h-4 max-w-full ${row.noteWidth}`}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="ml-auto h-5 w-24" />
                  <Skeleton className="ml-auto h-4 w-28" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-[18px] min-w-24 flex-1 rounded-full" />
                  <Skeleton className="h-5 w-9 shrink-0" />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="ml-auto h-5 w-20" />
                  <Skeleton className="ml-auto h-4 w-16" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function PaymentHistorySkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        {[0, 1].map((index) => (
          <div key={index} className="relative flex min-h-8 items-center gap-2 pl-6">
            <Skeleton className="absolute top-3 left-0 size-2 rounded-full" />
            {index === 0 ? (
              <span className="absolute top-4 bottom-[-12px] left-[3.5px] w-px bg-border" />
            ) : null}
            <Skeleton className="h-4 min-w-0 flex-1" />
            <Skeleton className="h-5 w-24 shrink-0" />
            <Skeleton className="size-7 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="h-16 content-center">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-5 w-28 max-w-full" />
            <Skeleton className="h-5 w-24 max-w-full" />
          </div>
        </div>
      </CardHeader>
      <Separator />

      <CardContent className="space-y-5 py-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <Skeleton className="h-5 w-48 max-w-full" />

        <div className="space-y-3 rounded-lg bg-muted p-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
          <Separator />
          <div className="flex items-end justify-between gap-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-[18px] w-full rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-1">
              <Skeleton className="h-5 w-24 max-w-full" />
              <Skeleton className="h-5 w-28 max-w-full" />
            </div>
          ))}
        </div>

        <PaymentHistorySkeleton />

        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DebtsLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-8 pb-24"
      role="status"
      aria-label="Đang tải vay nợ"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-8">
        <header className="pt-1">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-9 w-48 max-w-full" />
              <Skeleton className="h-5 w-96 max-w-full" />
            </div>
            <Skeleton className="h-8 w-full shrink-0 rounded-lg sm:w-36" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <SummarySkeleton />
          <SummarySkeleton />
          <SummarySkeleton />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <ContactSkeleton />
            <ContactSkeleton />
            <ContactSkeleton />
          </div>
        </section>

        <section className="space-y-4">
          <Skeleton className="h-7 w-24" />
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <DebtTableSkeleton />
            <DetailSkeleton />
          </div>
        </section>
      </div>

      <span className="sr-only">Đang tải danh bạ và các khoản vay nợ...</span>
    </div>
  )
}
