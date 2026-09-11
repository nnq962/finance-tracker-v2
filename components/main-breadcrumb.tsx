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
  "/accounts": "Tài khoản",
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
