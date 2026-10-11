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
import { transcribeLabAction, transcribeSherpaLabAction } from "@/lib/speech/actions"

import { getRecognitionConstructor, type Recognition, type RecognitionEvent } from "./speech-recognition"
import { spokenAmounts } from "./spoken-amounts"
import { recordingFormat, SPEECH_BITRATE } from "./whisper-lab"

/** Times each name is read, to tell a steady mistake from a one-off; a sentence, longer, twice. */
const ROUNDS = { names: 3, sentences: 2 } as const
/**
 * Quiet after the browser's last words before it stops on its own. Long
 * enough for Safari's last word to arrive: at 1.5 s, "ZaloPay" came back as "Zalo".
 */
const SILENCE_MS = 2500
/** The same while recording, measured on the microphone's level; a sentence has pauses inside it. */
const RECORDING_SILENCE_MS = { names: 1200, sentences: 1600 } as const
/** Above this level (RMS) the microphone hears speech. */
const SPEECH_LEVEL = 0.03
/** Listening stops here whatever it hears. */
const MAX_LISTENING_MS = 8000
const STORAGE_KEY = "voice-lab-bank-test-v2"
/** The first version's results, the browser's alone. */
const OLD_STORAGE_KEY = "voice-lab-bank-test"

type Recogniser = "browser" | "turbo" | "large" | "sherpa"

/** The browser's own, or one the recording is sent to on the server, with the model. */
const recognisers: { key: Recogniser; label: string; name: string; engine?: "whisper" | "sherpa"; model?: string }[] = [
  { key: "browser", label: "Web", name: "Trình duyệt (Web Speech)" },
  { key: "turbo", label: "Turbo", name: "Whisper large-v3-turbo", engine: "whisper", model: "whisper-large-v3-turbo" },
  { key: "large", label: "Large", name: "Whisper large-v3", engine: "whisper", model: "whisper-large-v3" },
  { key: "sherpa", label: "Sherpa", name: "Sherpa (Zipformer, máy chủ)", engine: "sherpa", model: "zipformer-vi-30M" },
]

/** Which recognisers hear the next reading, from the same recording. */
const modes: { value: string; label: string; using: Recogniser[] }[] = [
  { value: "all", label: "Tất cả", using: ["browser", "turbo", "large", "sherpa"] },
  { value: "browser", label: "Web", using: ["browser"] },
  { value: "whisper", label: "Whisper", using: ["turbo", "large"] },
  { value: "sherpa", label: "Sherpa", using: ["sherpa"] },
]

/** The prompt Whisper hears the reading with; each keeps its own results, to compare them. */
const prompts = [
  { value: "full", label: "Câu khung", name: "câu số tiền + câu có tên (đang dùng)" },
  { value: "names", label: "Tên trần", name: "câu số tiền + tên trần" },
  { value: "off", label: "Không", name: "không prompt" },
] as const
type PromptKind = (typeof prompts)[number]["value"]

/** What is read: bank and wallet names alone, or sentences as people enter money, with a sum each. */
const tests = [
  { value: "names", label: "Tên" },
  { value: "sentences", label: "Câu" },
] as const
type TestKind = (typeof tests)[number]["value"]

/** Sentences as people say them, each with its sum and the names it holds, to mark both. */
const SENTENCES: { text: string; amount: number; names: string[] }[] = [
  { text: "Ăn trưa 45 nghìn trả bằng MoMo", amount: 45_000, names: ["MoMo"] },
  { text: "Chuyển 2 triệu từ Vietcombank sang TPBank", amount: 2_000_000, names: ["Vietcombank", "TPBank"] },
  { text: "Đổ xăng 80k bằng thẻ Techcombank", amount: 80_000, names: ["Techcombank"] },
  { text: "Nhận lương 15 triệu vào MB Bank", amount: 15_000_000, names: ["MB Bank"] },
  { text: "Rút 3 triệu rưỡi ở BIDV", amount: 3_500_000, names: ["BIDV"] },
  { text: "Trả tiền điện 520 nghìn qua VPBank", amount: 520_000, names: ["VPBank"] },
  { text: "Nạp 200 nghìn vào ví ZaloPay", amount: 200_000, names: ["ZaloPay"] },
  { text: "Mua đồ 249 nghìn trả bằng ShopeePay", amount: 249_000, names: ["ShopeePay"] },
  { text: "Cà phê 35k trả bằng ACB", amount: 35_000, names: ["ACB"] },
  { text: "Cho Minh vay 1 triệu 2 qua Agribank", amount: 1_200_000, names: ["Agribank"] },
  { text: "Tiền nhà 4 triệu 500 qua VietinBank", amount: 4_500_000, names: ["VietinBank"] },
  { text: "Tiêu 1 củ 5 bằng tiền mặt", amount: 1_500_000, names: ["tiền mặt"] },
]

// The banks people here use come first in the list, before the foreign ones (HSBC on).
const firstForeign = banks.findIndex((bank) => bank.id === "hsbc")
const names = (withForeign: boolean) =>
  [...(withForeign ? banks : banks.slice(0, firstForeign)), ...eWallets].map((item) => item.shortName)

/**
 * What each recogniser heard in one reading, its names put right as dictation
 * does; one left out did not run, or failed. `raw`: what it said before that,
 * where it differs.
 */
type Attempt = Partial<Record<Recogniser, string>> & {
  raw?: Partial<Record<Recogniser, string>>
  /** How long each server recogniser's call took. */
  ms?: Partial<Record<Recogniser, number>>
}

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

/** For a sentence: whether every name in it came back, and its sum. A name alone has only the name. */
function judge(item: string, heard: string) {
  const sentence = SENTENCES.find((entry) => entry.text === item)
  if (!sentence) return { name: isRight(item, heard) }
  return {
    name: sentence.names.every((name) => isRight(name, heard)),
    amount: spokenAmounts(heard).includes(sentence.amount),
  }
}

function isResults(value: unknown): value is Results {
  const results = value as Results | null
  return Boolean(results && typeof results.heard === "object" && Array.isArray(results.skipped) && Array.isArray(results.history))
}

// Names with dictation's prompt keep the key their results started under.
const storageKey = (test: TestKind, kind: PromptKind) =>
  test === "sentences" ? `${STORAGE_KEY}:sentences:${kind}` : kind === "full" ? STORAGE_KEY : `${STORAGE_KEY}:${kind}`

/** The results of one test with one prompt, as kept in the state. */
const slot = (test: TestKind, kind: PromptKind) => `${test}:${kind}`

function readSaved(test: TestKind, kind: PromptKind): Results {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey(test, kind)) ?? "null")
    if (isResults(saved)) return saved
    if (test !== "names" || kind !== "full") return empty
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

function writeSaved(test: TestKind, kind: PromptKind, results: Results) {
  try {
    localStorage.setItem(storageKey(test, kind), JSON.stringify(results))
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

/**
 * What a recogniser heard of a name or sentence over its readings, and how
 * much of it was right: the names, and for a sentence the sum and both.
 */
function score(attempts: Attempt[], item: string, key: Recogniser) {
  const heard = attempts.flatMap((attempt) => {
    const text = attempt[key]
    if (text === undefined) return []
    const raw = attempt.raw?.[key]
    // Put right after hearing: what it was shows after an arrow.
    return [`${text || "∅"}${raw !== undefined && raw !== text ? ` ← ${raw || "∅"}` : ""}`]
  })
  const marks = attempts.flatMap((attempt) => (attempt[key] === undefined ? [] : [judge(item, attempt[key]!)]))
  return {
    right: marks.filter((mark) => mark.name).length,
    amounts: marks.filter((mark) => mark.amount).length,
    both: marks.filter((mark) => mark.name && mark.amount).length,
    total: heard.length,
    heard,
  }
}

/** A score as words, for a row or the copy: "tên 2/2 · tiền 1/2" for sentences. */
function scoreText(test: TestKind, { right, amounts, both, total }: ReturnType<typeof score>) {
  return test === "sentences" ? `tên ${right}/${total} · tiền ${amounts}/${total} · cả hai ${both}/${total}` : `${right}/${total}`
}

/**
 * Each bank and wallet name read a few times, heard by the browser's own
 * recogniser and Whisper (with the app's prompt) from the same reading, with
 * what each made of it kept and copied as text: shows which names each gets
 * wrong, and whether always the same way, to be put right after it.
 */
export function BankNameTest({ language }: { language: string }) {
  const [test, setTest] = React.useState<TestKind>("names")
  const [withForeign, setWithForeign] = React.useState(false)
  const [mode, setMode] = React.useState("all")
  // Kept on this phone, so a reload halfway through a long list loses nothing.
  // The lab only opens in a sheet after a tap, so this never renders on the server.
  const [promptKind, setPromptKind] = React.useState<PromptKind>("full")
  const [all, setAll] = React.useState<Record<string, Results>>(() =>
    typeof window === "undefined"
      ? {}
      : Object.fromEntries(
          tests.flatMap(({ value: kind }) => prompts.map(({ value }) => [slot(kind, value), readSaved(kind, value)])),
        ),
  )
  const results = all[slot(test, promptKind)] ?? empty
  const [phase, setPhase] = React.useState<"idle" | "listening" | "sending">("idle")
  const [live, setLive] = React.useState("")
  const stopRef = React.useRef<(() => void) | null>(null)
  const cancelRef = React.useRef<(() => void) | null>(null)
  const micRef = React.useRef<Microphone | null>(null)

  // The results the change is for: the ones shown, which cannot change while listening.
  const update = (change: (previous: Results) => Results) =>
    setAll((previous) => {
      const next = change(previous[slot(test, promptKind)] ?? empty)
      writeSaved(test, promptKind, next)
      return { ...previous, [slot(test, promptKind)]: next }
    })

  React.useEffect(
    () => () => {
      cancelRef.current?.()
      closeMicrophone(micRef)
    },
    [],
  )

  const list = test === "sentences" ? SENTENCES.map((entry) => entry.text) : names(withForeign)
  const rounds = ROUNDS[test]
  const current = list.find((name) => !results.skipped.includes(name) && (results.heard[name]?.length ?? 0) < rounds)
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
      if ((lastLoud && now - lastLoud > RECORDING_SILENCE_MS[test]) || now - startedAt > MAX_LISTENING_MS) return onSilence()
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

  async function whisper(file: File, model: string) {
    const formData = new FormData()
    formData.append("audio", file)
    formData.append("model", model)
    formData.append("prompt", promptKind)
    try {
      const result = await transcribeLabAction(formData)
      if (result.success) return { text: result.detail.text, raw: result.detail.rawText, ms: result.detail.groqMs }
      toast.error(result.error)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    }
    return undefined
  }

  async function sherpa(file: File) {
    const formData = new FormData()
    formData.append("audio", file)
    try {
      const result = await transcribeSherpaLabAction(formData)
      if (result.success) return { text: result.text, raw: result.rawText, ms: result.ms }
      toast.error(`Sherpa: ${result.error}`)
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

    const heardByWhisper: Promise<Partial<Record<Recogniser, { text: string; raw: string; ms: number } | undefined>>> = recording
      ? recording.done.then(async (file) => {
          if (cancelled) return {}
          setPhase("sending")
          const texts = await Promise.all(
            models.map((item) => (item.engine === "sherpa" ? sherpa(file) : whisper(file, item.model!))),
          )
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
    const ms: Partial<Record<Recogniser, number>> = {}
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
      ms[item.key] = heard.ms
    }
    // Every recogniser failed: nothing to keep, the same reading is asked again.
    if (Object.keys(attempt).length === 0) return
    attempt.raw = raw
    attempt.ms = ms
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
        const marks = score(results.heard[name] ?? [], name, item.key)
        return marks.total ? [{ line: `${name} (${scoreText(test, marks)}) → ${marks.heard.join(" | ")}`, marks }] : []
      })
      if (rows.length === 0) return []
      const sum = (pick: (marks: ReturnType<typeof score>) => number) => rows.reduce((total, row) => total + pick(row.marks), 0)
      const overall = {
        right: sum((marks) => marks.right),
        amounts: sum((marks) => marks.amounts),
        both: sum((marks) => marks.both),
        total: sum((marks) => marks.total),
        heard: [],
      }
      const detail =
        item.engine === "whisper"
          ? `prompt: ${prompts.find((kind) => kind.value === promptKind)?.name}`
          : item.engine === "sherpa"
            ? "gợi ý tên (hotwords)"
            : language
      // The wait each call took on the server, on average, for the recognisers that send the audio away.
      const times = done.flatMap((name) => (results.heard[name] ?? []).flatMap((attempt) => attempt.ms?.[item.key] ?? []))
      const wait = times.length ? ` · trung bình ${Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)} ms` : ""
      return [`## ${item.name} · ${detail} · đúng ${scoreText(test, overall)}${wait}`, ...rows.map((row) => row.line), ""]
    })
    const report = [`# ${test === "sentences" ? "Đọc câu" : "Đọc tên"} · ${navigator.userAgent}`, "", ...sections].join("\n").trim()
    try {
      await navigator.clipboard.writeText(report)
      toast.success(`Đã sao chép ${done.length} ${test === "sentences" ? "câu" : "tên"}.`)
    } catch {
      toast.error("Không sao chép được trên trình duyệt này.")
    }
  }

  const busy = phase !== "idle"

  return (
    <section className="space-y-3">
      <h3 className="px-3 text-sm font-medium text-muted-foreground">Đọc thử tên và câu</h3>
      <Field orientation="horizontal">
        <FieldLabel>Bài thử</FieldLabel>
        <ToggleGroup
          type="single"
          value={test}
          onValueChange={(value) => {
            if (value) setTest(value as TestKind)
          }}
          aria-label="Bài thử"
          disabled={busy}
        >
          {tests.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
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
      {test === "names" ? (
        <Field orientation="horizontal">
          <FieldLabel htmlFor="bank-test-foreign">Thêm ngân hàng nước ngoài</FieldLabel>
          <Switch id="bank-test-foreign" checked={withForeign} onCheckedChange={setWithForeign} disabled={busy} />
        </Field>
      ) : null}

      <Card size="sm">
        <CardContent className="space-y-1 text-center">
          {current ? (
            <>
              <p className="text-xs text-muted-foreground tabular-nums">
                {test === "sentences" ? "Câu" : "Tên"} {list.indexOf(current) + 1}/{list.length} · Lần {round}/{rounds}
              </p>
              <p
                className={test === "sentences" ? "text-xl font-semibold text-balance" : "text-2xl font-semibold tracking-tight"}
              >
                {current}
              </p>
              <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
                {phase === "sending"
                  ? "Đang nhận dạng…"
                  : live || (phase === "listening" ? "Đang nghe…" : `Bấm Nghe rồi đọc ${test === "sentences" ? "câu" : "tên"} này`)}
              </p>
            </>
          ) : (
            <p className="py-3 text-sm text-muted-foreground">Đã đọc hết. Sao chép kết quả ở dưới.</p>
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
          aria-label="Bỏ qua mục này"
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
          <SettingsGroup title={`Đã nghe (${done.length} ${test === "sentences" ? "câu" : "tên"})`}>
            {[...done].reverse().map((name) => {
              const attempts = results.heard[name] ?? []
              return (
                <SettingsRow
                  key={name}
                  title={name}
                  description={recognisers.map((item) => {
                    const marks = score(attempts, name, item.key)
                    return marks.total ? (
                      <span key={item.key} className="block">
                        {item.label} {scoreText(test, marks)}: {marks.heard.join(" · ")}
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
                if (window.confirm("Xoá kết quả của bài thử này với prompt này?")) update(() => empty)
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
