"use client"

import * as React from "react"
import { DownloadIcon, FileSpreadsheetIcon, FileTextIcon } from "lucide-react"

import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { ExportFormat, ExportPart } from "@/lib/user-data/export-options"
import { exportParts } from "@/lib/user-data/export-options"
import type { UserDataSummary } from "@/lib/user-data/repository"

const formatCount = (count: number) => count.toLocaleString("vi-VN")

/**
 * Cài đặt › Dữ liệu › Xuất dữ liệu (2026-10-20): the format (Excel with a
 * sheet per table, or CSV files zipped), what to include, then the file
 * downloads from /api/user-data/export. Nothing is kept on the server.
 */
export function ExportDataSheet({ summary, open, onOpenChange }: { summary: UserDataSummary; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [format, setFormat] = React.useState<ExportFormat>("xlsx")
  const [parts, setParts] = React.useState<Set<ExportPart>>(() => new Set(exportParts))

  const toggle = (part: ExportPart) =>
    setParts((current) => {
      const next = new Set(current)
      if (next.has(part)) next.delete(part)
      else next.add(part)
      return next
    })

  const rows: { part: ExportPart; title: string; value: string }[] = [
    { part: "transactions", title: "Giao dịch", value: `${formatCount(summary.transactions)} dòng` },
    { part: "accounts", title: "Tài khoản và hũ tiết kiệm", value: formatCount(summary.accounts) },
    { part: "debts", title: "Vay nợ và người liên hệ", value: `${formatCount(summary.debts)} khoản` },
    { part: "budgets", title: "Hạn mức chi tiêu", value: "" },
    { part: "categories", title: "Hạng mục", value: "" },
  ]

  const href = `/api/user-data/export?format=${format}&parts=${[...parts].join(",")}`

  return (
    <PageSheet
      title="Xuất dữ liệu"
      open={open}
      onOpenChange={onOpenChange}
      className="space-y-6"
      footer={
        <Button className="w-full" disabled={parts.size === 0} asChild>
          {/* A plain link: the browser saves the file, and an installed app opens the share sheet. */}
          <a href={href} download onClick={() => onOpenChange(false)}>
            <DownloadIcon data-icon="inline-start" />
            Tải xuống
          </a>
        </Button>
      }
    >
      <SettingsGroup title="Định dạng">
        <SettingsRow icon={FileSpreadsheetIcon} title="Excel (.xlsx)" description="Một file, mỗi bảng một sheet" checked={format === "xlsx"} onClick={() => setFormat("xlsx")} />
        <SettingsRow icon={FileTextIcon} title="CSV" description="Nén zip, mỗi bảng một file" checked={format === "csv"} onClick={() => setFormat("csv")} />
      </SettingsGroup>
      <SettingsGroup title="Gồm" footer="Số tiền để nguyên đơn vị đồng, ngày giờ theo giờ Việt Nam. File chỉ tải về máy bạn, Timi không giữ bản nào.">
        {rows.map((row) => (
          <SettingsRow
            key={row.part}
            title={row.title}
            value={row.value || undefined}
            action={<Checkbox checked={parts.has(row.part)} onCheckedChange={() => toggle(row.part)} aria-label={row.title} />}
          />
        ))}
      </SettingsGroup>
    </PageSheet>
  )
}
