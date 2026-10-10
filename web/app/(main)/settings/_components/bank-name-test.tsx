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
import { normalizeTranscript } from "@/lib/speech/normalize"
import { transcribeLabAction } from "@/lib/speech/actions"
import type { WhisperModel } from "@/lib/speech/groq"

import { getRecognitionConstructor, type Recognition, type RecognitionEvent } from "./speech-recognition"
import { recordingFormat, SPEECH_BITRATE } from "./whisper-lab"

/** Times each name is read, to tell a steady mistake from a one-off. */
const ROUNDS = 3
/**
 * Quiet after the browser's last words before it stops on its own. Long
 * enough for Safari's last word to arrive: at 1.5 s, "ZaloPay" came back as "Zalo".
 */
const SILENCE_MS = 2500
/** The same while recording, measured on the microphone's level. */
const RECORDING_SILENCE_MS = 1200
/** Above this level (RMS) the microphone hears speech. */
const SPEECH_LEVEL = 0.03
/** Listening stops here whatever it hears. */
const MAX_LISTENING_MS = 8000
const STORAGE_KEY = "voice-lab-bank-test-v2"
/** The first version's results, the browser's alone. */
const OLD_STORAGE_KEY = "voice-lab-bank-test"

type Recogniser = "browser" | "turbo" | "large"

const recognisers: { key: Recogniser; label: string; name: string; model?: WhisperModel }[] = [
  { key: "browser", label: "Web", name: "Trình duyệt (Web Speech)" },
  { key: "turbo", label: "Turbo", name: "Whisper large-v3-turbo", model: "whisper-large-v3-turbo" },
  { key: "large", label: "Large", name: "Whisper large-v3", model: "whisper-large-v3" },
]

/** Which recognisers hear the next reading: all three at once, or one. */
const modes: { value: string; label: string; using: Recogniser[] }[] = [
  { value: "all", label: "Cả ba", using: ["browser", "turbo", "large"] },
  ...recognisers.map((item) => ({ value: item.key, label: item.label, using: [item.key] })),
]

/** The prompt Whisper hears the reading with; each keeps its own results, to compare them. */
const prompts = [
  { value: "full", label: "Câu", name: "câu số tiền + câu có tên (đang dùng)" },
  { value: "names", label: "Tên trần", name: "câu số tiền + tên trần" },
  { value: "off", label: "Không", name: "không prompt" },
] as const
type PromptKind = (typeof prompts)[number]["value"]

// The banks people here use come first in the list, before the foreign ones (HSBC on).
const firstForeign = banks.findIndex((bank) => bank.id === "hsbc")
const names = (withForeign: boolean) =>
  [...(withForeign ? banks : banks.slice(0, firstForeign)), ...eWallets].map((item) => item.shortName)

/**
 * What each recogniser heard in one reading, its names put right as dictation
 * does; one left out did not run, or failed. `raw`: what it said before that,
 * where it differs.
 */
type Attempt = Partial<Record<Recogniser, string>> & { raw?: Partial<Record<Recogniser, string>> }

type Results = {
  heard: Record<string, Attempt[]>
  skipped: string[]
  /** Each step in order, for taking the last one back. */
  history: { name: string; kind: "heard" | "skipped" }[]
}

const empty: Results = { heard: {}, skipped: [], history: [] }

const squash = (value: string) => normalizeSearchValue(value).replace(/[^a-z0-9]/g, "")
/** Heard as written: the name's letters appear in what came back, case, accents and spaces aside. */
const isRight = (name: string, heard: string) => squash(heard).includes(squash(name))

function isResults(value: unknown): value is Results {
  const results = value as Results | null
  return Boolean(results && typeof results.heard === "object" && Array.isArray(results.skipped) && Array.isArray(results.history))
}

// Dictation's prompt keeps the key its results started under.
const storageKey = (kind: PromptKind) => (kind === "full" ? STORAGE_KEY : `${STORAGE_KEY}:${kind}`)

function readSaved(kind: PromptKind): Results {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey(kind)) ?? "null")
    if (isResults(saved)) return saved
    if (kind !== "full") return empty
    // The first version kept the browser's words as plain strings.
    const old: unknown = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY) ?? "null")
    if (isResults(old)) {
      const heard = Object.fromEntries(
        Object.entries(old.heard as unknown as Record<string, string[]>).map(([name, texts]) => [
          name,
          texts.map((text) => ({ browser: text })),
        ]),
      )
      return { ...old, heard }
    }
  } catch {}
  return empty
}

function writeSaved(kind: PromptKind, results: Results) {
  try {
    localStorage.setItem(storageKey(kind), JSON.stringify(results))
  } catch {}
}

type Microphone = { stream: MediaStream; context: AudioContext; analyser: AnalyserNode }

function closeMicrophone(ref: React.RefObject<Microphone | null>) {
  const open = ref.current
  ref.current = null
  if (!open) return
  open.stream.getTracks().forEach((track) => track.stop())
  void open.context.close()
}

/** What a recogniser heard of a name over its readings, and how much of it was right. */
function score(attempts: Attempt[], name: string, key: Recogniser) {
  const heard = attempts.flatMap((attempt) => {
    const text = attempt[key]
    if (text === undefined) return []
    const raw = attempt.raw?.[key]
    // Put right after hearing: what it was shows after an arrow.
    return [`${text || "∅"}${raw !== undefined && raw !== text ? ` ← ${raw || "∅"}` : ""}`]
  })
  const right = attempts.filter((attempt) => attempt[key] !== undefined && isRight(name, attempt[key]!)).length
  return { right, total: heard.length, heard }
}

/**
 * Each bank and wallet name read a few times, heard by the browser's own
 * recogniser and Whisper (with the app's prompt) from the same reading, with
 * what each made of it kept and copied as text: shows which names each gets
 * wrong, and whether always the same way, to be put right after it.
 */
export function BankNameTest({ language }: { language: string }) {
  const [withForeign, setWithForeign] = React.useState(false)
  const [mode, setMode] = React.useState("all")
  // Kept on this phone, so a reload halfway through a long list loses nothing.
  // The lab only opens in a sheet after a tap, so this never renders on the server.
  const [promptKind, setPromptKind] = React.useState<PromptKind>("full")
  const [all, setAll] = React.useState<Partial<Record<PromptKind, Results>>>(() =>
    typeof window === "undefined" ? {} : Object.fromEntries(prompts.map(({ value }) => [value, readSaved(value)])),
  )
  const results = all[promptKind] ?? empty
  const [phase, setPhase] = React.useState<"idle" | "listening" | "sending">("idle")
  const [live, setLive] = React.useState("")
  const stopRef = React.useRef<(() => void) | null>(null)
  const cancelRef = React.useRef<(() => void) | null>(null)
  const micRef = React.useRef<Microphone | null>(null)

  // The prompt's results the change is for: the one shown, which cannot change while listening.
  const update = (change: (previous: Results) => Results) =>
    setAll((previous) => {
      const next = change(previous[promptKind] ?? empty)
      writeSaved(promptKind, next)
      return { ...previous, [promptKind]: next }
    })

  React.useEffect(
    () => () => {
      cancelRef.current?.()
      closeMicrophone(micRef)
    },
    [],
  )

  const list = names(withForeign)
  const current = list.find((name) => !results.skipped.includes(name) && (results.heard[name]?.length ?? 0) < ROUNDS)
  const round = current ? (results.heard[current]?.length ?? 0) + 1 : 0
  const done = list.filter((name) => (results.heard[name]?.length ?? 0) > 0)
  const using = modes.find((item) => item.value === mode)?.using ?? []

  /** The browser's recogniser, until stop(); `done` gives its words, or undefined when it failed. */
  function startBrowser(onSilence: (() => void) | null) {
    const Constructor = getRecognitionConstructor()
    if (!Constructor) {
      toast.error("Trình duyệt này không hỗ trợ nhận dạng giọng nói.")
      return null
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
    const finished = new Promise<string | undefined>((resolve) => {
      recogniser.addEventListener("result", (event) => {
        const { results: heard } = event as RecognitionEvent
        text = Array.from(heard, (result) => result[0].transcript).join(" ").replace(/\s+/g, " ").trim()
        setLive(text)
        if (onSilence) {
          window.clearTimeout(silence)
          silence = window.setTimeout(onSilence, SILENCE_MS)
        }
      })
      recogniser.addEventListener("error", (event) => {
        const { error } = event as Event & { error: string }
        if (error === "no-speech" || error === "aborted") return
        // Not a hearing: the microphone or the service failed, so nothing is kept.
        failed = true
        toast.error(`Trình duyệt: ${error}`)
      })
      // Whatever Safari sends after stop() comes before "end", so the last word is in.
      recogniser.addEventListener("end", () => {
        window.clearTimeout(silence)
        resolve(failed ? undefined : text)
      })
    })
    try {
      recogniser.start()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
      return null
    }
    return {
      done: finished,
      stop: () => recogniser.stop(),
      abort: () => {
        window.clearTimeout(silence)
        recogniser.abort()
      },
    }
  }

  /**
   * The microphone, opened once and kept for the next readings. On an iPhone,
   * asking for it again after closing it, with the browser's recogniser on
   * it too, got nothing from the second reading on.
   */
  async function openMicrophone() {
    const open = micRef.current
    if (open && open.stream.getAudioTracks().every((track) => track.readyState === "live")) {
      // Safari suspends an audio context it did not start from a tap.
      if (open.context.state !== "running") await open.context.resume().catch(() => undefined)
      return open
    }
    closeMicrophone(micRef)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    })
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 1024
    context.createMediaStreamSource(stream).connect(analyser)
    micRef.current = { stream, context, analyser }
    return micRef.current
  }

  /** A recording that ends by itself after the speech; `done` gives the audio. */
  async function startRecording(onSilence: () => void) {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Trình duyệt này không ghi âm được.")
      return null
    }
    let microphone: Microphone
    try {
      microphone = await openMicrophone()
    } catch (error) {
      toast.error(`Không mở được micro: ${error instanceof Error ? error.name : String(error)}`)
      return null
    }
    const { stream, analyser } = microphone
    const format = recordingFormat()
    const recorder = new MediaRecorder(stream, {
      ...(format.type ? { mimeType: format.type } : {}),
      audioBitsPerSecond: SPEECH_BITRATE,
    })
    const chunks: Blob[] = []

    // Ends once the speech is over, as the browser's recogniser does.
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
      if ((lastLoud && now - lastLoud > RECORDING_SILENCE_MS) || now - startedAt > MAX_LISTENING_MS) return onSilence()
      frame = requestAnimationFrame(watch)
    }
    const finished = new Promise<File>((resolve) => {
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      })
      // The microphone stays open for the next reading.
      recorder.addEventListener("stop", () => {
        cancelAnimationFrame(frame)
        const audio = new Blob(chunks, { type: recorder.mimeType || format.type || "audio/webm" })
        resolve(new File([audio], `speech.${format.extension}`, { type: audio.type }))
      })
    })
    recorder.start()
    watch()
    return {
      done: finished,
      stop: () => {
        cancelAnimationFrame(frame)
        if (recorder.state === "recording") recorder.stop()
      },
    }
  }

  async function whisper(file: File, model: WhisperModel) {
    const formData = new FormData()
    formData.append("audio", file)
    formData.append("model", model)
    formData.append("prompt", promptKind)
    try {
      const result = await transcribeLabAction(formData)
      if (result.success) return { text: result.detail.text, raw: result.detail.rawText }
      toast.error(result.error)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    }
    return undefined
  }

  async function listen() {
    if (!current) return
    const name = current
    const models = recognisers.filter((item) => item.model && using.includes(item.key))
    let cancelled = false
    let stopped = false
    let recording: Awaited<ReturnType<typeof startRecording>> = null
    let browser: ReturnType<typeof startBrowser> = null
    const stopAll = () => {
      if (stopped) return
      stopped = true
      recording?.stop()
      browser?.stop()
    }

    if (models.length === 0) closeMicrophone(micRef)
    setLive("")
    setPhase("listening")
    // The recording first: on an iPhone the recogniser, opened second, may not get the microphone.
    if (models.length > 0) {
      recording = await startRecording(stopAll)
      if (!recording) return setPhase("idle")
    }
    // With a recording, the microphone's level says when the speech is over; alone, the recogniser's words do.
    if (using.includes("browser")) browser = startBrowser(recording ? null : stopAll)
    if (!recording && !browser) return setPhase("idle")
    // Nothing heard at all: stopped anyway.
    const limit = window.setTimeout(stopAll, MAX_LISTENING_MS + 1000)

    stopRef.current = stopAll
    cancelRef.current = () => {
      cancelled = true
      window.clearTimeout(limit)
      recording?.stop()
      browser?.abort()
    }

    const heardByWhisper: Promise<Partial<Record<Recogniser, { text: string; raw: string } | undefined>>> = recording
      ? recording.done.then(async (file) => {
          if (cancelled) return {}
          setPhase("sending")
          const texts = await Promise.all(models.map((item) => whisper(file, item.model!)))
          return Object.fromEntries(models.map((item, index) => [item.key, texts[index]]))
        })
      : Promise.resolve({})
    const [browserText, whisperTexts] = await Promise.all([browser?.done, heardByWhisper])
    window.clearTimeout(limit)
    stopRef.current = null
    cancelRef.current = null
    if (cancelled) return
    setPhase("idle")
    setLive("")

    const attempt: Attempt = {}
    const raw: Partial<Record<Recogniser, string>> = {}
    if (browserText !== undefined) {
      // As dictation does with the browser's words.
      attempt.browser = normalizeTranscript(browserText)
      raw.browser = browserText
    }
    for (const item of models) {
      const heard = whisperTexts[item.key]
      if (heard === undefined) continue
      attempt[item.key] = heard.text
      raw[item.key] = heard.raw
    }
    // Every recogniser failed: nothing to keep, the same reading is asked again.
    if (Object.keys(attempt).length === 0) return
    attempt.raw = raw
    update((previous) => ({
      ...previous,
      heard: { ...previous.heard, [name]: [...(previous.heard[name] ?? []), attempt] },
      history: [...previous.history, { name, kind: "heard" }],
    }))
  }

  function undo() {
    update((previous) => {
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
    // One section per recogniser that heard anything, with its score over all names.
    const sections = recognisers.flatMap((item) => {
      const rows = done.flatMap((name) => {
        const { right, total, heard } = score(results.heard[name] ?? [], name, item.key)
        return total
          ? [{ line: `${name} (${right}/${total}) → ${heard.join(" | ")}`, right, total }]
          : []
      })
      if (rows.length === 0) return []
      const right = rows.reduce((sum, row) => sum + row.right, 0)
      const total = rows.reduce((sum, row) => sum + row.total, 0)
      const detail = item.model ? `prompt: ${prompts.find((kind) => kind.value === promptKind)?.name}` : language
      return [`## ${item.name} · ${detail} · đúng ${right}/${total}`, ...rows.map((row) => row.line), ""]
    })
    const report = [`# ${navigator.userAgent}`, "", ...sections].join("\n").trim()
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
        value={mode}
        onValueChange={(value) => {
          if (value) setMode(value)
        }}
        className="flex-wrap"
        aria-label="Bộ nhận dạng"
        disabled={busy}
      >
        {modes.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {/* For Whisper; the browser's recogniser takes none. */}
      <Field orientation="horizontal">
        <FieldLabel>Prompt</FieldLabel>
        <ToggleGroup
          type="single"
          value={promptKind}
          onValueChange={(value) => {
            if (value) setPromptKind(value as PromptKind)
          }}
          aria-label="Prompt cho Whisper"
          disabled={busy}
        >
          {prompts.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
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
          onClick={() => (phase === "listening" ? stopRef.current?.() : void listen())}
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
            update((previous) => ({
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
              const attempts = results.heard[name] ?? []
              return (
                <SettingsRow
                  key={name}
                  title={name}
                  description={recognisers.map((item) => {
                    const { right, total, heard } = score(attempts, name, item.key)
                    return total ? (
                      <span key={item.key} className="block">
                        {item.label} {right}/{total}: {heard.join(" · ")}
                      </span>
                    ) : null
                  })}
                  fullDescription
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
                if (window.confirm("Xoá kết quả đọc tên của prompt này?")) update(() => empty)
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
