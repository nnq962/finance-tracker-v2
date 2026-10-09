"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { StatusBarTint } from "@/components/ui/status-bar-tint"

type Mode = "sync" | "manual" | "off"

type Probe = "off" | "plain" | "nudge"

const probeLabels: Record<Probe, string> = {
  off: "Tắt",
  plain: "Đổi màu",
  nudge: "Đổi màu + cuộn 1px",
}

/**
 * A strip at the top that swaps colour every second with no touch at all, to
 * see when Safari takes a new colour for the bar: on its own, or only when
 * the page scrolls (nudge: 1px down and back with each swap).
 */
function SamplingProbe({ probe }: { probe: Probe }) {
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    if (probe === "off") return
    const timer = window.setInterval(() => {
      setTick((value) => value + 1)
      if (probe === "nudge") {
        window.scrollBy(0, 1)
        requestAnimationFrame(() => window.scrollBy(0, -1))
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [probe])

  if (probe === "off") return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[max(env(safe-area-inset-top,0px),1px)]"
      style={{ backgroundColor: tick % 2 ? "var(--income)" : "var(--ai)" }}
    />
  )
}

const modeLabels: Record<Mode, string> = {
  sync: "Dải đồng bộ (như app)",
  manual: "Dải chỉnh tay",
  off: "Không dải",
}

/**
 * A veil like the app's overlays over coloured content, with the status bar
 * strip on or off. Static: compare colours at one dim. Animated: fade the veil
 * slowly to see whether the bar keeps pace.
 */
export function StatusBarLab() {
  const veilRef = React.useRef<HTMLDivElement>(null)
  const [mode, setMode] = React.useState<Mode>("sync")
  const [dim, setDim] = React.useState(30)
  const [bias, setBias] = React.useState(0)
  const [duration, setDuration] = React.useState(3000)
  const [shown, setShown] = React.useState(false)
  const [blur, setBlur] = React.useState(true)
  // Mounted transparent when it is about to fade in, so it never flashes.
  const [entering, setEntering] = React.useState(false)
  const [probe, setProbe] = React.useState<Probe>("off")

  const fade = (to: 0 | 1) => {
    const veil = veilRef.current
    if (!veil) return
    const animation = veil.animate([{ opacity: to === 1 ? 0 : 1 }, { opacity: to }], {
      duration,
      easing: "cubic-bezier(0.32, 0.72, 0, 1)",
    })
    veil.style.opacity = String(to)
    animation.finished.then(() => {
      if (to === 0) setShown(false)
      else setEntering(false)
    }, () => undefined)
  }

  const open = () => {
    setEntering(true)
    setShown(true)
    requestAnimationFrame(() => fade(1))
  }

  return (
    <div className="flex flex-col gap-4 pb-80">
      <h1 className="text-2xl font-semibold">Status bar lab</h1>
      <p className="text-sm text-muted-foreground">
        Cuộn lên đầu trang. So màu thanh trạng thái với nội dung ngay dưới nó.
      </p>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid grid-cols-3 gap-2">
          <div className="h-16 rounded-xl bg-income" />
          <div className="h-16 rounded-xl bg-card" />
          <div className="h-16 rounded-xl bg-ai" />
        </div>
      ))}

      <SamplingProbe probe={probe} />

      {shown ? (
        <div
          key={`${mode}-${dim}-${bias}-${blur}`}
          ref={veilRef}
          style={{ "--dim": dim / 100, opacity: entering ? 0 : undefined } as React.CSSProperties}
          className={
            blur
              ? "pointer-events-none fixed inset-0 z-40 before:absolute before:inset-0 before:bg-[rgb(0_0_0/var(--dim))] before:backdrop-blur-[2px]"
              : "pointer-events-none fixed inset-0 z-40 before:absolute before:inset-0 before:bg-[rgb(0_0_0/var(--dim))]"
          }
        >
          {mode === "sync" ? <StatusBarTint /> : null}
          {mode === "manual" ? (
            <div
              aria-hidden="true"
              className="fixed inset-x-0 top-0 h-[max(env(safe-area-inset-top,0px),1px)]"
              style={{ backgroundColor: `color-mix(in srgb, var(--background), black ${Math.max(dim + bias, 0)}%)` }}
            />
          ) : null}
        </div>
      ) : null}

      <div className="fixed inset-x-2 bottom-[calc(var(--tab-bar-space)+0.5rem)] z-50 flex flex-col gap-3 rounded-2xl bg-card p-3 text-sm shadow-xl md:bottom-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-full text-muted-foreground">Thử lấy mẫu (tự đổi màu mỗi giây)</span>
          {(Object.keys(probeLabels) as Probe[]).map((key) => (
            <Button key={key} size="sm" variant={probe === key ? "default" : "secondary"} onClick={() => setProbe(key)}>
              {probeLabels[key]}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(modeLabels) as Mode[]).map((key) => (
            <Button key={key} size="sm" variant={mode === key ? "default" : "secondary"} onClick={() => setMode(key)}>
              {modeLabels[key]}
            </Button>
          ))}
        </div>
        <label className="flex items-center gap-3">
          <span className="w-24 shrink-0">Độ tối {dim}%</span>
          <Slider min={0} max={60} step={1} value={[dim]} onValueChange={([value]) => setDim(value)} />
        </label>
        {mode === "manual" ? (
          <label className="flex items-center gap-3">
            <span className="w-24 shrink-0">Bù {bias > 0 ? "+" : ""}{bias}%</span>
            <Slider min={-20} max={20} step={1} value={[bias]} onValueChange={([value]) => setBias(value)} />
          </label>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {[500, 3000].map((value) => (
            <Button key={value} size="sm" variant={duration === value ? "default" : "secondary"} onClick={() => setDuration(value)}>
              {value / 1000}s
            </Button>
          ))}
          <Button size="sm" variant={blur ? "default" : "secondary"} onClick={() => setBlur((value) => !value)}>
            Blur
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Button size="sm" onClick={open} disabled={shown}>
            Phủ dần
          </Button>
          <Button size="sm" onClick={() => fade(0)} disabled={!shown}>
            Bỏ dần
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShown((value) => !value)}>
            {shown ? "Tắt ngay" : "Bật ngay"}
          </Button>
        </div>
      </div>
    </div>
  )
}
