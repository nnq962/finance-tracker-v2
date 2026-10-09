"use client"

import type * as React from "react"
import { useEffect, useState, useSyncExternalStore } from "react"
import {
  BookmarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  Share2Icon,
  SquarePlusIcon,
  type LucideIcon,
} from "lucide-react"

import { StepFlow } from "@/components/app/step-flow"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
}

function isRunningStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosNavigator.standalone === true
  )
}

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

function subscribeToStandaloneChange(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(display-mode: standalone)")

  mediaQuery.addEventListener("change", onStoreChange)
  window.addEventListener("appinstalled", onStoreChange)

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange)
    window.removeEventListener("appinstalled", onStoreChange)
  }
}

function subscribeToClientEnvironment() {
  return () => undefined
}

function getServerSnapshot() {
  return false
}

/**
 * Whether this browser can install the app and how: iOS only through Safari's
 * Share menu (see IosInstallSheet), others through the browser's prompt.
 * Not available once the app runs installed.
 */
export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const isIOS = useSyncExternalStore(
    subscribeToClientEnvironment,
    isIOSDevice,
    getServerSnapshot,
  )
  const isStandalone = useSyncExternalStore(
    subscribeToStandaloneChange,
    isRunningStandalone,
    getServerSnapshot,
  )

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setInstallPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      )
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  async function install() {
    if (!installPrompt) return

    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  return {
    available: !isStandalone && (isIOS || installPrompt !== null),
    /** Running from the Home Screen, i.e. already installed. */
    isStandalone,
    isIOS,
    install,
  }
}

/** Safari itself, not another browser or an app's own browser (Chrome, Zalo, Facebook…) on iOS. */
function isIOSSafari() {
  return !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Zalo|Line\//.test(navigator.userAgent)
}

/**
 * Where a step's illustration asks for the tap: a blue ring with a halo
 * rippling out of it (animate-tap-ring draws both); the ring alone, still,
 * when motion is reduced.
 */
function TapTarget({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("rounded-full ring-2 ring-transfer ring-offset-2 ring-offset-card motion-safe:animate-tap-ring", className)}>
      {children}
    </span>
  )
}

/** A row of an iOS menu or share sheet, drawn small. */
function MenuRow({ icon: Icon, label, target = false }: { icon: LucideIcon; label: string; target?: boolean }) {
  const row = (
    <span className="flex h-9 items-center justify-between gap-3 px-3 text-xs">
      {label}
      <Icon className="size-4 shrink-0" aria-hidden="true" />
    </span>
  )
  // Inset in its list, so the ring (2 of offset, 2 of ring) stays inside the list's grey, its corners too; no divider of its own.
  return target ? <TapTarget className="m-1.5 block rounded-lg border-0 bg-card">{row}</TapTarget> : row
}

/** Safari's bar at the foot of the screen (iOS 26): back, the address, and ••• where Share now is. */
function SafariBarPicture({ origin }: { origin: string }) {
  return (
    <div className="flex w-full flex-col items-end gap-2">
      <div className="w-40 divide-y divide-border rounded-xl bg-background">
        <MenuRow icon={BookmarkIcon} label="Thêm dấu trang" />
        <MenuRow icon={Share2Icon} label="Chia sẻ" target />
      </div>
      <div className="flex w-full items-center gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-background">
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
        </span>
        <span className="flex h-9 min-w-0 flex-1 items-center justify-center truncate rounded-full bg-background px-3 text-xs">
          {origin}
        </span>
        <TapTarget className="shrink-0">
          <span className="grid size-9 place-items-center rounded-full bg-background">
            <EllipsisIcon className="size-4" aria-hidden="true" />
          </span>
        </TapTarget>
      </div>
    </div>
  )
}

/** The share sheet's list, "Thêm vào Màn hình chính" among its actions. */
function ShareSheetPicture() {
  return (
    <div className="w-full divide-y divide-border rounded-xl bg-background">
      <MenuRow icon={CopyIcon} label="Sao chép" />
      <MenuRow icon={SquarePlusIcon} label="Thêm vào Màn hình chính" target />
      <MenuRow icon={BookmarkIcon} label="Thêm dấu trang" />
    </div>
  )
}

/** The last screen: the app's icon and name, web app on, Thêm at the top right. */
function AddScreenPicture() {
  return (
    <div className="flex w-full flex-col gap-2 rounded-xl bg-background p-3 text-xs">
      {/* Equal sides around the title, as iOS centres it on the screen whatever the buttons' widths. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="justify-self-start text-muted-foreground">Huỷ</span>
        <span className="font-medium">Thêm vào MH chính</span>
        <TapTarget className="justify-self-end">
          <span className="block px-2 py-0.5 font-semibold text-transfer">Thêm</span>
        </TapTarget>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-card p-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- the app's own icon, as the Home Screen will show it */}
        <img src="/icons/pwa-192.png" alt="" className="size-8 rounded-[8px]" />
        <span className="font-medium">Finance Tracker</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-card p-2">
        Mở dưới dạng ứng dụng web
        <span aria-hidden="true" className="flex h-4 w-7 items-center justify-end rounded-full bg-income p-0.5">
          <span className="size-3 rounded-full bg-card" />
        </span>
      </div>
    </div>
  )
}

/** The app's address, to paste into Safari, copied whole (with https://) with a tap. */
function OpenInSafariPicture({ origin }: { origin: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span className="flex h-9 w-full items-center justify-center truncate rounded-full bg-background px-3 text-xs">
        {origin}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          void navigator.clipboard?.writeText(window.location.origin).then(() => setCopied(true))
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Đã chép" : "Chép liên kết"}
      </Button>
    </div>
  )
}

type InstallStep = { title: string; hint: string; picture: React.ReactNode }

/**
 * Adding the app to the Home Screen from Safari, one step at a time, as an
 * app's onboarding: a bottom sheet with the app's icon, then each step as a
 * small drawing of the very screen it happens on, the place to tap ringed in
 * blue, its title and one line. The steps swipe sideways, or go on with the
 * button; dots say where one is. Opened in another browser (Chrome, Zalo…),
 * the first step is opening it in Safari, the link a tap away.
 */
export function IosInstallSheet({
  trigger,
  open: openProp,
  onOpenChange,
}: {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    setOpenState(next)
    onOpenChange?.(next)
  }
  const inSafari = useSyncExternalStore(subscribeToClientEnvironment, isIOSSafari, () => true)
  const origin = useSyncExternalStore(subscribeToClientEnvironment, () => window.location.host, () => "")
  const [step, setStep] = useState(0)
  // Each opening starts at the first step.
  const [shownFor, setShownFor] = useState(open)
  if (open !== shownFor) {
    setShownFor(open)
    if (open) setStep(0)
  }

  const steps: InstallStep[] = [
    ...(inSafari
      ? []
      : [{ title: "Mở trang này bằng Safari", hint: "Chép liên kết, dán vào Safari rồi làm tiếp ở đó.", picture: <OpenInSafariPicture origin={origin} /> }]),
    { title: "Chạm ••• rồi Chia sẻ", hint: "iOS cũ hơn: nút Chia sẻ nằm ngay trên thanh dưới.", picture: <SafariBarPicture origin={origin} /> },
    { title: "Chọn Thêm vào Màn hình chính", hint: "Chưa thấy thì cuộn xuống danh sách.", picture: <ShareSheetPicture /> },
    { title: "Bật ứng dụng web, chạm Thêm", hint: "Finance Tracker sẽ nằm trên Màn hình chính.", picture: <AddScreenPicture /> },
  ]

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent surface="grouped">
        <div className="flex flex-col items-center px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- the app's own icon, as the Home Screen will show it */}
          <img src="/icons/pwa-192.png" alt="" className="size-14 rounded-[14px] shadow-sm" />
          <DrawerTitle className="mt-3 text-lg">Cài Finance Tracker</DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            {steps.length} bước để mở như một ứng dụng
          </DrawerDescription>

          <StepFlow
            label="Các bước cài"
            step={step}
            onStepChange={setStep}
            doneLabel="Đã hiểu"
            onDone={() => setOpen(false)}
            className="mt-5 w-full"
            steps={steps.map(({ title, hint, picture }, index) => ({
              key: title,
              label: title,
              content: (
                <>
                  <div className="flex h-44 items-center justify-center rounded-3xl bg-card px-6">{picture}</div>
                  <p className="mt-4 text-xs font-medium text-muted-foreground">
                    Bước {index + 1}/{steps.length}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
                </>
              ),
            }))}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export function PwaInstallButton() {
  const { available, isIOS, install } = usePwaInstall()

  if (!available) return null

  if (isIOS) {
    return (
      <IosInstallSheet
        trigger={
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
          >
            <DownloadIcon />
            Cài ứng dụng
          </Button>
        }
      />
    )
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full sm:w-auto"
      onClick={() => void install()}
    >
      <DownloadIcon />
      Cài ứng dụng
    </Button>
  )
}
