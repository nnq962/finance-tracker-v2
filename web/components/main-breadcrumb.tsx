"use client"

import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { appNavigationItems } from "@/lib/app-navigation"

const routeLabels: Record<string, string> = {
  "/design": "Thiết kế",
  "/settings/plan": "Gói",
}

// The tabs' own pages: their bar already names them, so the crumb would only repeat it.
const tabRoots = new Set([...appNavigationItems.map((item) => item.url), "/settings"])

/** The page's name in the desktop top bar, after a divider, on pages a tab does not already name. */
export function MainBreadcrumb() {
  const pathname = usePathname()
  if (tabRoots.has(pathname)) return null
  const label = routeLabels[pathname] ?? "Finance Tracker"

  return (
    <>
      <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </>
  )
}
