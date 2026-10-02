"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import {
  DownloadIcon,
  ExternalLinkIcon,
  Share2Icon,
  SquarePlusIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

export function PwaInstallButton() {
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

  if (isStandalone) return null

  if (isIOS) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
          >
            <DownloadIcon />
            Cài ứng dụng
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cài Finance Tracker trên iPhone hoặc iPad</DialogTitle>
            <DialogDescription>
              Thực hiện trong Safari để mở Finance Tracker như một ứng dụng độc
              lập từ Màn hình chính.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#d6f4ff] text-[#0083c4] dark:bg-[#113950] dark:text-[#78d0ff]">
                <ExternalLinkIcon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading font-extrabold">Mở bằng Safari</p>
                <p className="text-muted-foreground">
                  Truy cập finance.nnqlab.dev trong Safari.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#d6f4ff] text-[#0083c4] dark:bg-[#113950] dark:text-[#78d0ff]">
                <Share2Icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading font-extrabold">Chạm nút Chia sẻ</p>
                <p className="text-muted-foreground">
                  Nút Chia sẻ nằm trên thanh công cụ của Safari.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#d6f4ff] text-[#0083c4] dark:bg-[#113950] dark:text-[#78d0ff]">
                <SquarePlusIcon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading font-extrabold">
                  Chọn Thêm vào Màn hình chính
                </p>
                <p className="text-muted-foreground">
                  Bật “Mở dưới dạng ứng dụng web”, sau đó chọn Thêm.
                </p>
              </div>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    )
  }

  if (!installPrompt) return null

  async function handleInstall() {
    if (!installPrompt) return

    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full sm:w-auto"
      onClick={() => void handleInstall()}
    >
      <DownloadIcon />
      Cài ứng dụng
    </Button>
  )
}
