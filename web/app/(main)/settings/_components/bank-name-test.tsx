"use client"

import * as React from "react"
import { CopyIcon, MicIcon, SkipForwardIcon, SquareIcon, Undo2Icon } from "lucide-react"
import { toast } from "sonner"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { banks, eWallets } from "@/lib/institutions"
import { normalizeSearchValue } from "@/lib/search-text"
import { transcribeLabAction } from "@/lib/speech/actions"

import { getRecognitionConstructor, type Recognition, type RecognitionEvent } from "./speech-recognition"
import { recordingFormat, SPEECH_BITRATE } from "./whisper-lab"

/** Times each name is read, to tell a steady mistake from a one-off. */
const ROUNDS = 3
/**
 * Quiet after the last words before listening stops on its own. Long enough
 * for Safari's last word to arrive: at 1.5 s, "ZaloPay" came back as "Zalo".
 */
const SILENCE_MS = 2500
/** The same for a recording, measured on the microphone's level. */
const RECORDING_SILENCE_MS = 1200
/** Above this level (RMS) the microphone hears speech. */
const SPEECH_LEVEL = 0.03
/** A recording stops here whatever it hears. */
const MAX_RECORDING_MS = 8000
const STORAGE_KEY = "voice-lab-bank-test"

const engines = [
  { value: "browser", label: "Trình duyệt", name: "Trình duyệt (Web Speech)" },
  { value: "whisper-large-v3-turbo", label: "Turbo", name: "Whisper large-v3-turbo" },
  { value: "whisper-large-v3", label: "Large-v3", name: "Whisper large-v3" },
] as const
type Engine = (typeof engines)[number]["value"]

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

// Each engine's results apart, to compare them; the browser's keep the key they started with.
const storageKey = (engine: Engine) => (engine === "browser" ? STORAGE_KEY : `${STORAGE_KEY}:${engine}`)

function readSaved(engine: Engine): Results {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(engine)) ?? "null") as Results | null
    if (saved && typeof saved.heard === "object" && Array.isArray(saved.skipped) && Array.isArray(saved.history)) {
      return saved
    }
  } catch {}
  return empty
}

function writeSaved(engine: Engine, results: Results) {
  try {
    localStorage.setItem(storageKey(engine), JSON.stringify(results))
  } catch {}
}

/**
 * Each bank and wallet name read a few times, through the browser's own
 * recogniser or Whisper (with the app's prompt), with what came back kept
 * and copied as text: shows which names each gets wrong, and whether always
 * the same way, to be put right after it.
 */
export function BankNameTest({ language }: { language: string }) {
  const [withForeign, setWithForeign] = React.useState(false)
  const [engine, setEngine] = React.useState<Engine>("browser")
  // Kept on this phone, so a reload halfway through a long list loses nothing.
  // The lab only opens in a sheet after a tap, so this never renders on the server.
  const [all, setAll] = React.useState<Partial<Record<Engine, Results>>>(() =>
    typeof window === "undefined" ? {} : Object.fromEntries(engines.map(({ value }) => [value, readSaved(value)])),
  )
  const [phase, setPhase] = React.useState<"idle" | "listening" | "sending">("idle")
  const [live, setLive] = React.useState("")
  const stopRef = React.useRef<(() => void) | null>(null)
  const cancelRef = React.useRef<(() => void) | null>(null)

  const results = all[engine] ?? empty
  const update = (target: Engine, change: (previous: Results) => Results) =>
    setAll((previous) => {
      const next = change(previous[target] ?? empty)
      writeSaved(target, next)
      return { ...previous, [target]: next }
    })

  React.useEffect(() => () => cancelRef.current?.(), [])

  const list = names(withForeign)
  const current = list.find((name) => !results.skipped.includes(name) && (results.heard[name]?.length ?? 0) < ROUNDS)
  const round = current ? (results.heard[current]?.length ?? 0) + 1 : 0
  const done = list.filter((name) => (results.heard[name]?.length ?? 0) > 0)

  const keep = (target: Engine, name: string, text: string) =>
    update(target, (previous) => ({
      ...previous,
      heard: { ...previous.heard, [name]: [...(previous.heard[name] ?? []), text] },
      history: [...previous.history, { name, kind: "heard" }],
    }))

  function listenInBrowser(name: string) {
    const Constructor = getRecognitionConstructor()
    if (!Constructor) {
      toast.error("Trình duyệt này không hỗ trợ nhận dạng giọng nói.")
      return
    }
    const recogniser: Recognition = new Constructor()
    recogniser.lang = language
    // Safari on iPhone only hears with continuous on; stopped after a pause instead.
    recogniser.continuous = true
    recogniser.interimResults = true
    recogniser.maxAlternatives = 1
    let text = ""
    let failed = false
    let silence: number | undefined
    recogniser.addEventListener("result", (event) => {
      const { results: heard } = event as RecognitionEvent
      text = Array.from(heard, (result) => result[0].transcript).join(" ").replace(/\s+/g, " ").trim()
      setLive(text)
      window.clearTimeout(silence)
      silence = window.setTimeout(() => recogniser.stop(), SILENCE_MS)
    })
    recogniser.addEventListener("error", (event) => {
      const { error } = event as Event & { error: string }
      if (error === "no-speech" || error === "aborted") return
      // Not a hearing: the microphone or the service failed, so nothing is kept.
      failed = true
      toast.error(`Lỗi nhận dạng: ${error}`)
    })
    // Whatever Safari sends after stop() comes before "end", so the last word is in.
    recogniser.addEventListener("end", () => {
      window.clearTimeout(silence)
      stopRef.current = null
      cancelRef.current = null
      setPhase("idle")
      setLive("")
      if (!failed) keep("browser", name, text)
    })
    stopRef.current = () => recogniser.stop()
    cancelRef.current = () => {
      window.clearTimeout(silence)
      recogniser.abort()
    }
    setLive("")
    try {
      recogniser.start()
      setPhase("listening")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    }
  }

  async function listenWithWhisper(name: string, model: Exclude<Engine, "browser">) {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Trình duyệt này không ghi âm được.")
      return
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
    } catch (error) {
      toast.error(`Không mở được micro: ${error instanceof Error ? error.name : String(error)}`)
      return
    }
    const format = recordingFormat()
    const recorder = new MediaRecorder(stream, {
      ...(format.type ? { mimeType: format.type } : {}),
      audioBitsPerSecond: SPEECH_BITRATE,
    })
    const chunks: Blob[] = []
    let cancelled = false

    // Stops by itself once the speech is over, as the browser's recogniser does.
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 1024
    context.createMediaStreamSource(stream).connect(analyser)
    const samples = new Float32Array(analyser.fftSize)
    let startedAt = 0
    let lastLoud = 0
    let frame = 0
    const watch = () => {
      analyser.getFloatTimeDomainData(samples)
      const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length)
      const now = performance.now()
      startedAt ||= now
      if (rms > SPEECH_LEVEL) lastLoud = now
      if ((lastLoud && now - lastLoud > RECORDING_SILENCE_MS) || now - startedAt > MAX_RECORDING_MS) {
        if (recorder.state === "recording") recorder.stop()
        return
      }
      frame = requestAnimationFrame(watch)
    }
    const release = () => {
      cancelAnimationFrame(frame)
      stream.getTracks().forEach((track) => track.stop())
      void context.close()
    }

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    })
    recorder.addEventListener("stop", async () => {
      release()
      stopRef.current = null
      if (cancelled) return
      setPhase("sending")
      const audio = new Blob(chunks, { type: recorder.mimeType || format.type || "audio/webm" })
      const formData = new FormData()
      formData.append("audio", new File([audio], `speech.${format.extension}`, { type: audio.type }))
      formData.append("model", model)
      try {
        const result = await transcribeLabAction(formData)
        if (cancelled) return
        if (result.success) keep(model, name, result.detail.text)
        else toast.error(result.error)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error))
      }
      cancelRef.current = null
      setPhase("idle")
    })
    stopRef.current = () => {
      if (recorder.state === "recording") recorder.stop()
    }
    cancelRef.current = () => {
      cancelled = true
      if (recorder.state === "recording") recorder.stop()
      else release()
    }
    recorder.start()
    watch()
    setLive("")
    setPhase("listening")
  }

  function listen() {
    if (!current) return
    if (engine === "browser") listenInBrowser(current)
    else void listenWithWhisper(current, engine)
  }

  function undo() {
    update(engine, (previous) => {
      const last = previous.history.at(-1)
      if (!last) return previous
      return {
        heard:
          last.kind === "heard"
            ? { ...previous.heard, [last.name]: (previous.heard[last.name] ?? []).slice(0, -1) }
            : previous.heard,
        skipped: last.kind === "skipped" ? previous.skipped.filter((item) => item !== last.name) : previous.skipped,
        history: previous.history.slice(0, -1),
      }
    })
  }

  async function copy() {
    const lines = done.map((name) => {
      const heard = results.heard[name] ?? []
      const right = heard.filter((text) => isRight(name, text)).length
      return `${name} (${right}/${heard.length}) → ${heard.map((text) => text || "∅").join(" | ")}`
    })
    const total = done.reduce((sum, name) => sum + (results.heard[name]?.length ?? 0), 0)
    const right = done.reduce(
      (sum, name) => sum + (results.heard[name] ?? []).filter((text) => isRight(name, text)).length,
      0,
    )
    const label = engines.find((item) => item.value === engine)?.name
    const report = [
      `# ${label} · ${engine === "browser" ? language : "có prompt"} · đúng ${right}/${total} · ${navigator.userAgent}`,
      ...lines,
    ].join("\n")
    try {
      await navigator.clipboard.writeText(report)
      toast.success(`Đã sao chép ${done.length} tên.`)
    } catch {
      toast.error("Không sao chép được trên trình duyệt này.")
    }
  }

  const busy = phase !== "idle"

  return (
    <section className="space-y-3">
      <h3 className="px-3 text-sm font-medium text-muted-foreground">Đọc tên ngân hàng</h3>
      <ToggleGroup
        type="single"
        value={engine}
        onValueChange={(value) => {
          if (value) setEngine(value as Engine)
        }}
        className="flex-wrap"
        aria-label="Bộ nhận dạng"
        disabled={busy}
      >
        {engines.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Field orientation="horizontal">
        <FieldLabel htmlFor="bank-test-foreign">Thêm ngân hàng nước ngoài</FieldLabel>
        <Switch id="bank-test-foreign" checked={withForeign} onCheckedChange={setWithForeign} disabled={busy} />
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
                {phase === "sending"
                  ? "Đang nhận dạng…"
                  : live || (phase === "listening" ? "Đang nghe…" : "Bấm Nghe rồi đọc tên này")}
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
          variant={phase === "listening" ? "destructive" : "default"}
          disabled={!current || phase === "sending"}
          onClick={() => (phase === "listening" ? stopRef.current?.() : listen())}
        >
          {phase === "sending" ? <Spinner /> : phase === "listening" ? <SquareIcon /> : <MicIcon />}
          {phase === "listening" ? "Dừng" : "Nghe"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Bỏ qua tên này"
          disabled={busy || !current}
          onClick={() =>
            current &&
            update(engine, (previous) => ({
              ...previous,
              skipped: [...previous.skipped, current],
              history: [...previous.history, { name: current, kind: "skipped" }],
            }))
          }
        >
          <SkipForwardIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Xoá lần đọc vừa rồi"
          disabled={busy || results.history.length === 0}
          onClick={undo}
        >
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
              disabled={busy}
              onClick={() => {
                if (window.confirm("Xoá toàn bộ kết quả đọc tên của bộ nhận dạng này?")) update(engine, () => empty)
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
