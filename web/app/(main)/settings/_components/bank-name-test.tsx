"use client"

import * as React from "react"
import { CopyIcon, MicIcon, SkipForwardIcon, SquareIcon, Undo2Icon } from "lucide-react"
import { toast } from "sonner"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { banks, eWallets } from "@/lib/institutions"
import { normalizeSearchValue } from "@/lib/search-text"

import { getRecognitionConstructor, type Recognition, type RecognitionEvent } from "./speech-recognition"

/** Times each name is read, to tell a steady mistake from a one-off. */
const ROUNDS = 3
/** Quiet after the last words before listening stops on its own. */
const SILENCE_MS = 1500
const STORAGE_KEY = "voice-lab-bank-test"

// The banks people here use come first in the list, before the foreign ones (HSBC on).
const firstForeign = banks.findIndex((bank) => bank.id === "hsbc")
const names = (withForeign: boolean) =>
  [...(withForeign ? banks : banks.slice(0, firstForeign)), ...eWallets].map((item) => item.shortName)

type Results = {
  heard: Record<string, string[]>
  skipped: string[]
  /** Each step in order, for taking the last one back. */
  history: { name: string; kind: "heard" | "skipped" }[]
}

const empty: Results = { heard: {}, skipped: [], history: [] }

const squash = (value: string) => normalizeSearchValue(value).replace(/[^a-z0-9]/g, "")
/** Heard as written: the name's letters appear in what came back, case, accents and spaces aside. */
const isRight = (name: string, heard: string) => squash(heard).includes(squash(name))

function readSaved(): Results {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Results | null
    if (saved && typeof saved.heard === "object" && Array.isArray(saved.skipped) && Array.isArray(saved.history)) {
      return saved
    }
  } catch {}
  return empty
}

/**
 * Each bank and wallet name read a few times through the browser's own
 * recogniser, with what it heard kept and copied as text: shows which names
 * it always gets wrong the same way, to be put right after it.
 */
export function BankNameTest({ language }: { language: string }) {
  const [withForeign, setWithForeign] = React.useState(false)
  // Kept on this phone, so a reload halfway through a long list loses nothing.
  // The lab only opens in a sheet after a tap, so this never renders on the server.
  const [results, setResults] = React.useState<Results>(() => (typeof window === "undefined" ? empty : readSaved()))
  const [listening, setListening] = React.useState(false)
  const [live, setLive] = React.useState("")
  const recognition = React.useRef<Recognition | null>(null)
  const silence = React.useRef<number | undefined>(undefined)

  const save = (next: Results) => {
    setResults(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }

  React.useEffect(
    () => () => {
      window.clearTimeout(silence.current)
      recognition.current?.abort()
    },
    [],
  )

  const list = names(withForeign)
  const current = list.find((name) => !results.skipped.includes(name) && (results.heard[name]?.length ?? 0) < ROUNDS)
  const round = current ? (results.heard[current]?.length ?? 0) + 1 : 0
  const done = list.filter((name) => (results.heard[name]?.length ?? 0) > 0)

  function listen() {
    const Constructor = getRecognitionConstructor()
    if (!Constructor || !current) {
      if (!Constructor) toast.error("Trình duyệt này không hỗ trợ nhận dạng giọng nói.")
      return
    }
    const name = current
    const recogniser = new Constructor()
    recogniser.lang = language
    // Safari on iPhone only hears with continuous on; stopped after a pause instead.
    recogniser.continuous = true
    recogniser.interimResults = true
    recogniser.maxAlternatives = 1
    let text = ""
    let failed = false
    recogniser.addEventListener("result", (event) => {
      const { results: heard } = event as RecognitionEvent
      text = Array.from(heard, (result) => result[0].transcript).join(" ").replace(/\s+/g, " ").trim()
      setLive(text)
      window.clearTimeout(silence.current)
      silence.current = window.setTimeout(() => recogniser.stop(), SILENCE_MS)
    })
    recogniser.addEventListener("error", (event) => {
      const { error } = event as Event & { error: string }
      if (error === "no-speech" || error === "aborted") return
      // Not a hearing: the microphone or the service failed, so nothing is kept.
      failed = true
      toast.error(`Lỗi nhận dạng: ${error}`)
    })
    recogniser.addEventListener("end", () => {
      window.clearTimeout(silence.current)
      recognition.current = null
      setListening(false)
      setLive("")
      if (failed) return
      setResults((previous) => {
        const next: Results = {
          ...previous,
          heard: { ...previous.heard, [name]: [...(previous.heard[name] ?? []), text] },
          history: [...previous.history, { name, kind: "heard" }],
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {}
        return next
      })
    })
    recognition.current = recogniser
    setLive("")
    try {
      recogniser.start()
      setListening(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    }
  }

  function undo() {
    const last = results.history.at(-1)
    if (!last) return
    save({
      heard:
        last.kind === "heard"
          ? { ...results.heard, [last.name]: (results.heard[last.name] ?? []).slice(0, -1) }
          : results.heard,
      skipped: last.kind === "skipped" ? results.skipped.filter((item) => item !== last.name) : results.skipped,
      history: results.history.slice(0, -1),
    })
  }

  async function copy() {
    const lines = done.map((name) => {
      const heard = results.heard[name] ?? []
      const right = heard.filter((text) => isRight(name, text)).length
      return `${name} (${right}/${heard.length}) → ${heard.map((text) => text || "∅").join(" | ")}`
    })
    const report = [`# ${language} · ${navigator.userAgent}`, ...lines].join("\n")
    try {
      await navigator.clipboard.writeText(report)
      toast.success(`Đã sao chép ${done.length} tên.`)
    } catch {
      toast.error("Không sao chép được trên trình duyệt này.")
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="px-3 text-sm font-medium text-muted-foreground">Đọc tên ngân hàng (Web Speech)</h3>
      <Field orientation="horizontal">
        <FieldLabel htmlFor="bank-test-foreign">Thêm ngân hàng nước ngoài</FieldLabel>
        <Switch id="bank-test-foreign" checked={withForeign} onCheckedChange={setWithForeign} disabled={listening} />
      </Field>

      <Card size="sm">
        <CardContent className="space-y-1 text-center">
          {current ? (
            <>
              <p className="text-xs text-muted-foreground tabular-nums">
                Tên {list.indexOf(current) + 1}/{list.length} · Lần {round}/{ROUNDS}
              </p>
              <p className="text-2xl font-semibold tracking-tight">{current}</p>
              <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
                {live || (listening ? "Đang nghe…" : "Bấm Nghe rồi đọc tên này")}
              </p>
            </>
          ) : (
            <p className="py-3 text-sm text-muted-foreground">Đã đọc hết danh sách. Sao chép kết quả ở dưới.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <Button
          type="button"
          variant={listening ? "destructive" : "default"}
          disabled={!current}
          onClick={() => (listening ? recognition.current?.stop() : listen())}
        >
          {listening ? <SquareIcon /> : <MicIcon />}
          {listening ? "Dừng" : "Nghe"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Bỏ qua tên này"
          disabled={listening || !current}
          onClick={() =>
            current &&
            save({
              ...results,
              skipped: [...results.skipped, current],
              history: [...results.history, { name: current, kind: "skipped" }],
            })
          }
        >
          <SkipForwardIcon />
        </Button>
        <Button type="button" variant="outline" size="icon" aria-label="Xoá lần đọc vừa rồi" disabled={listening || results.history.length === 0} onClick={undo}>
          <Undo2Icon />
        </Button>
      </div>

      {done.length > 0 ? (
        <>
          <SettingsGroup title={`Đã nghe (${done.length} tên)`}>
            {[...done].reverse().map((name) => {
              const heard = results.heard[name] ?? []
              return (
                <SettingsRow
                  key={name}
                  title={name}
                  description={heard.map((text) => text || "∅").join(" · ")}
                  fullDescription
                  value={`${heard.filter((text) => isRight(name, text)).length}/${heard.length}`}
                />
              )
            })}
          </SettingsGroup>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => void copy()}>
              <CopyIcon />
              Sao chép
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={listening}
              onClick={() => {
                if (window.confirm("Xoá toàn bộ kết quả đọc tên?")) save(empty)
              }}
            >
              Làm lại từ đầu
            </Button>
          </div>
        </>
      ) : null}
    </section>
  )
}
