"use client"

import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

const routeLabels: Record<string, string> = {
  "/overview": "Tổng quan",
  "/transactions": "Giao dịch",
  "/budget": "Ngân sách",
  "/debts": "Nợ & Cho vay",
  "/settings": "Cài đặt",
  ...(process.env.NODE_ENV === "development"
    ? { "/ui-lab": "Thử giao diện" }
    : {}),
}

export function MainBreadcrumb() {
  const pathname = usePathname()
  const label = routeLabels[pathname] ?? "Finance Tracker"

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>{label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
