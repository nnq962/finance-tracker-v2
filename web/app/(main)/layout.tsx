import type { Metadata } from "next"
import type { ReactNode } from "react"

import { AssistantProvider } from "@/components/ai-assistant/assistant"
import { HeaderAccountProvider } from "@/components/app/app-header"
import { DesktopTopBar } from "@/components/app/desktop-top-bar"
import { AuthSessionGuard } from "@/components/auth-session-guard"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { WelcomeProvider } from "@/components/onboarding/welcome"
import { PwaThemeColor } from "@/components/pwa-theme-color"
import { PushMessageListener } from "@/components/push-message-listener"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { isDevSessionUser, requireSignedSession } from "@/lib/auth/session"
import { needsOnboarding } from "@/lib/onboarding/repository"
import { getPlanState } from "@/lib/plans/repository"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
}

export default async function MainLayout({ children, sheet }: { children: ReactNode; sheet: ReactNode }) {
  // The cookie's signature only: the shell and the loading screens go out at
  // once; every page's data still waits for the revocation check (loadWithSession).
  const { user, expiresAt } = await requireSignedSession()
  // A failed read only skips the welcome (or the PRO label on the avatar); it never blocks the app.
  const [firstRun, plan] = await Promise.all([
    needsOnboarding(user.uid).catch(() => false),
    getPlanState(user.uid).then((state) => state.plan, () => null),
  ])

  return (
    <AuthSessionGuard initialUid={user.uid} sessionExpiresAt={expiresAt} devSession={isDevSessionUser(user)}>
      <PushMessageListener />
      <HeaderAccountProvider account={{ name: user.name, avatar: user.avatar, pro: plan === "pro" }}>
      <TooltipProvider>
        <WelcomeProvider firstRun={firstRun}>
          <AssistantProvider>
          <SidebarProvider
            data-app-shell="main"
            // The floating tab bar's height plus its gap from the screen's bottom edge.
            className="h-dvh min-h-0 flex-col overflow-hidden [--tab-bar-space:calc(3.875rem+max(1.25rem,calc(env(safe-area-inset-bottom,0px)-0.75rem)))] md:h-auto md:min-h-svh md:flex-col md:overflow-visible"
          >
            <PwaThemeColor />
            <SidebarInset
              data-main-scroll-viewport
              className="min-h-0 min-w-0 overflow-y-auto overscroll-y-contain [--main-content-px:--spacing(4)] [-webkit-overflow-scrolling:touch] md:min-h-svh md:overflow-visible md:[--main-content-px:--spacing(12)]"
            >
              <div
                aria-hidden="true"
                className="h-[env(safe-area-inset-top,0px)] shrink-0 md:hidden"
              />
              {/* From md the top bar (2026-10-25, the sidebar is gone): the logo, the pages, Hỏi Timi, the bell, the avatar. */}
              <DesktopTopBar />
              {/* A 1px scroll range keeps iOS bounce inside this pane on short pages. */}
              {/* Vertical rhythm and bottom padding come from each page's <Page>; on
                  phones the floating tab bar's space is added below it. A pushed
                  screen that hides the bar for its whole stay (Settings,
                  data-hide-tab-bar="page") keeps only the safe area below. */}
              <div className="flex min-h-[calc(100%+1px)] shrink-0 grow flex-col px-(--main-content-px) pt-4 pb-(--tab-bar-space) md:mx-auto md:w-full md:max-w-[1136px] md:min-h-0 md:pt-0 md:pb-12 [body:has([data-hide-tab-bar=page])_&]:pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
                {children}
              </div>
            </SidebarInset>
            <MobileBottomNav />
            {/* Settings opened from inside the app on a phone rises here, over the page (@sheet). */}
            {sheet}
          </SidebarProvider>
          </AssistantProvider>
        </WelcomeProvider>
      </TooltipProvider>
      </HeaderAccountProvider>
    </AuthSessionGuard>
  )
}
