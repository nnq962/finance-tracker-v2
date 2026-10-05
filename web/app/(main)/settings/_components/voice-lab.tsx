"use client"

import * as React from "react"
import { CopyIcon, MicIcon, MicOffIcon, SquareIcon } from "lucide-react"
import { toast } from "sonner"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { WhisperLab, type WhisperRun } from "./whisper-lab"

// The Web Speech API's recogniser; TypeScript's DOM types lack its constructor.
type Recognition = EventTarget & {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionEvent = Event & {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }>
}
type RecognitionErrorEvent = Event & { error: string; message?: string }

function getRecognitionConstructor() {
  if (typeof window === "undefined") return null
  const scope = window as unknown as Record<string, (new () => Recognition) | undefined>
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

// What each recognition error usually means, in plain words.
const errorHints: Record<string, string> = {
  "not-allowed": "Chưa cho phép dùng micro (hoặc trình duyệt chặn).",
  "service-not-allowed": "Trình duyệt hoặc chế độ app không cho dùng dịch vụ nhận dạng.",
  network: "Không kết nối được dịch vụ nhận dạng (cần mạng).",
  "no-speech": "Không nghe thấy tiếng nói.",
  "audio-capture": "Không lấy được âm thanh từ micro.",
  "language-not-supported": "Ngôn ngữ này không được hỗ trợ.",
  aborted: "Đã huỷ.",
}

const permissionLabels: Record<string, string> = {
  granted: "Đã cho phép",
  denied: "Đã chặn",
  prompt: "Sẽ hỏi khi dùng",
}

type LogEntry = { at: number; event: string; detail?: string }

type Environment = {
  secure: boolean
  standalone: boolean
  recognition: string | null
  getUserMedia: boolean
  permission: string
  userAgent: string
}

function readEnvironment(): Environment {
  const scope = window as unknown as Record<string, unknown>
  return {
    secure: window.isSecureContext,
    standalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    recognition: scope.SpeechRecognition
      ? "SpeechRecognition"
      : scope.webkitSpeechRecognition
        ? "webkitSpeechRecognition"
        : null,
    getUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
    permission: "đang kiểm tra",
    userAgent: navigator.userAgent,
  }
}

/** Speech recognition and microphone checks on this device, for trying voice
 * entry on different phones and browsers before building it. */
export function VoiceLab() {
  const [environment, setEnvironment] = React.useState<Environment | null>(null)
  const [language, setLanguage] = React.useState("vi-VN")
  const [continuous, setContinuous] = React.useState(false)
  const [interim, setInterim] = React.useState(true)
  const [listening, setListening] = React.useState(false)
  const [finalText, setFinalText] = React.useState("")
  const [interimText, setInterimText] = React.useState("")
  const [alternatives, setAlternatives] = React.useState<{ transcript: string; confidence: number }[]>([])
  const [log, setLog] = React.useState<LogEntry[]>([])
  const [level, setLevel] = React.useState<number | null>(null)
  const [micInfo, setMicInfo] = React.useState("")
  const [dictation, setDictation] = React.useState("")
  const [whisperRuns, setWhisperRuns] = React.useState<WhisperRun[]>([])
  const recognition = React.useRef<Recognition | null>(null)
  const startedAt = React.useRef(0)
  const meter = React.useRef<{ stop: () => void } | null>(null)

  React.useEffect(() => {
    let cancelled = false
    const info = readEnvironment()
    // The Permissions API knows "microphone" in Chrome, not in every Safari.
    const permissions = navigator.permissions?.query({ name: "microphone" as PermissionName })
    void Promise.resolve(permissions)
      .then((status) => permissionLabels[status?.state ?? ""] ?? "không rõ (trình duyệt không cho biết)")
      .catch(() => "không rõ (trình duyệt không cho biết)")
      .then((permission) => {
        if (!cancelled) setEnvironment({ ...info, permission })
      })
    return () => {
      cancelled = true
      recognition.current?.abort()
      meter.current?.stop()
    }
  }, [])

  const addLog = (event: string, detail?: string) =>
    setLog((entries) => [...entries, { at: Math.round(performance.now() - startedAt.current), event, detail }])

  function startRecognition() {
    const Constructor = getRecognitionConstructor()
    if (!Constructor) {
      toast.error("Trình duyệt này không hỗ trợ nhận dạng giọng nói.")
      return
    }
    const recogniser = new Constructor()
    recogniser.lang = language
    recogniser.continuous = continuous
    recogniser.interimResults = interim
    recogniser.maxAlternatives = 3
    for (const name of ["start", "audiostart", "soundstart", "speechstart", "speechend", "soundend", "audioend", "nomatch"]) {
      recogniser.addEventListener(name, () => addLog(name))
    }
    recogniser.addEventListener("result", (event) => {
      const { resultIndex, results } = event as RecognitionEvent
      let finals = ""
      let pending = ""
      for (let index = resultIndex; index < results.length; index++) {
        const result = results[index]
        if (result.isFinal) {
          finals += result[0].transcript
          setAlternatives(Array.from({ length: result.length }, (_, option) => ({
            transcript: result[option].transcript,
            confidence: result[option].confidence,
          })))
        } else {
          pending += result[0].transcript
        }
      }
      if (finals) {
        setFinalText((text) => `${text}${text ? " " : ""}${finals.trim()}`)
        addLog("result", finals.trim())
      }
      setInterimText(pending)
    })
    recogniser.addEventListener("error", (event) => {
      const { error, message } = event as RecognitionErrorEvent
      addLog("error", `${error}${errorHints[error] ? ` · ${errorHints[error]}` : ""}${message ? ` · ${message}` : ""}`)
    })
    recogniser.addEventListener("end", () => {
      addLog("end")
      setListening(false)
      setInterimText("")
      recognition.current = null
    })
    recognition.current = recogniser
    startedAt.current = performance.now()
    setLog([])
    setAlternatives([])
    setInterimText("")
    try {
      recogniser.start()
      setListening(true)
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : String(error))
    }
  }

  async function startMeter() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Trình duyệt này không cho truy cập micro.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 1024
      context.createMediaStreamSource(stream).connect(analyser)
      const samples = new Float32Array(analyser.fftSize)
      let frame = 0
      const tick = () => {
        analyser.getFloatTimeDomainData(samples)
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length)
        // Speech sits around 0.02-0.2 RMS; spread that over the bar.
        setLevel(Math.min(100, Math.round(Math.sqrt(rms) * 220)))
        frame = requestAnimationFrame(tick)
      }
      tick()
      const track = stream.getAudioTracks()[0]
      setMicInfo(`${track?.label || "Micro mặc định"} · ${context.sampleRate} Hz`)
      meter.current = {
        stop: () => {
          cancelAnimationFrame(frame)
          stream.getTracks().forEach((item) => item.stop())
          void context.close()
        },
      }
    } catch (error) {
      toast.error(`Không mở được micro: ${error instanceof Error ? error.name : String(error)}`)
    }
  }

  function stopMeter() {
    meter.current?.stop()
    meter.current = null
    setLevel(null)
  }

  async function copyReport() {
    const report = {
      environment,
      settings: { language, continuous, interim },
      transcript: finalText,
      alternatives,
      log,
      microphone: micInfo,
      dictation,
      whisper: whisperRuns,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
      toast.success("Đã sao chép kết quả.")
    } catch {
      toast.error("Không sao chép được trên trình duyệt này.")
    }
  }

  const yesNo = (value: boolean) => (value ? "Có" : "Không")

  return (
    <div className="space-y-6">
      <SettingsGroup title="Thiết bị này">
        <SettingsRow title="Kết nối bảo mật (HTTPS)" value={environment ? yesNo(environment.secure) : "…"} />
        <SettingsRow
          title="Đang mở bằng"
          value={environment ? (environment.standalone ? "App đã cài" : "Trình duyệt") : "…"}
        />
        <SettingsRow
          title="Nhận dạng giọng nói"
          description={environment?.recognition ?? undefined}
          value={environment ? (environment.recognition ? "Hỗ trợ" : "Không hỗ trợ") : "…"}
        />
        <SettingsRow title="Truy cập micro" value={environment ? yesNo(environment.getUserMedia) : "…"} />
        <SettingsRow title="Quyền micro" value={environment?.permission ?? "…"} />
        <SettingsRow title="Trình duyệt" description={environment?.userAgent} />
      </SettingsGroup>

      <WhisperLab onRun={(run) => setWhisperRuns((runs) => [...runs, run])} />

      <section className="space-y-3">
        <h3 className="px-3 text-xs font-semibold text-muted-foreground">
          Nhận dạng giọng nói (Web Speech)
        </h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="voice-language">Ngôn ngữ</FieldLabel>
            <Select value={language} onValueChange={setLanguage} disabled={listening}>
              <SelectTrigger id="voice-language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi-VN">Tiếng Việt (vi-VN)</SelectItem>
                <SelectItem value="en-US">Tiếng Anh (en-US)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="voice-continuous">Nghe liên tục</FieldLabel>
            <Switch id="voice-continuous" checked={continuous} onCheckedChange={setContinuous} disabled={listening} />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="voice-interim">Hiện kết quả tạm</FieldLabel>
            <Switch id="voice-interim" checked={interim} onCheckedChange={setInterim} disabled={listening} />
          </Field>
          <Button
            type="button"
            className="w-full"
            variant={listening ? "destructive" : "default"}
            onClick={() => (listening ? recognition.current?.stop() : startRecognition())}
          >
            {listening ? <SquareIcon /> : <MicIcon />}
            {listening ? "Dừng nghe" : "Bắt đầu nghe"}
          </Button>
          <Field>
            <FieldLabel>Văn bản nhận được</FieldLabel>
            <p className="min-h-16 rounded-lg border p-3 text-base" aria-live="polite">
              {finalText}
              {interimText ? <span className="text-muted-foreground"> {interimText}</span> : null}
              {!finalText && !interimText ? (
                <span className="text-muted-foreground">Thử nói: “ăn phở 45 nghìn ví tiền mặt”.</span>
              ) : null}
            </p>
            {finalText ? (
              <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setFinalText("")}>
                Xoá văn bản
              </Button>
            ) : null}
          </Field>
        </FieldGroup>
        {alternatives.length > 0 ? (
          <SettingsGroup title="Các phương án của câu cuối">
            {alternatives.map((option, index) => (
              <SettingsRow
                key={index}
                title={option.transcript || "—"}
                value={option.confidence ? `${Math.round(option.confidence * 100)}%` : "không rõ"}
              />
            ))}
          </SettingsGroup>
        ) : null}
        {log.length > 0 ? (
          <SettingsGroup title="Nhật ký sự kiện">
            {log.map((entry, index) => (
              <SettingsRow
                key={index}
                title={entry.event}
                description={entry.detail}
                value={`${entry.at} ms`}
              />
            ))}
          </SettingsGroup>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="px-3 text-xs font-semibold text-muted-foreground">
          Micro (mức âm thanh)
        </h3>
        <FieldGroup>
          <Button type="button" variant="outline" className="w-full" onClick={() => (level === null ? void startMeter() : stopMeter())}>
            {level === null ? <MicIcon /> : <MicOffIcon />}
            {level === null ? "Thử micro" : "Tắt micro"}
          </Button>
          {level !== null ? (
            <Field>
              <Progress value={level} aria-label={`Mức âm thanh ${level}%`} />
              <FieldDescription>{micInfo}</FieldDescription>
            </Field>
          ) : null}
        </FieldGroup>
      </section>

      <section className="space-y-3">
        <h3 className="px-3 text-xs font-semibold text-muted-foreground">
          Đọc chính tả bằng bàn phím
        </h3>
        <Field>
          <Textarea
            value={dictation}
            onChange={(event) => setDictation(event.target.value)}
            placeholder="Bấm vào đây rồi dùng nút micro trên bàn phím"
          />
          <FieldDescription>
            Cách dự phòng chạy trên mọi máy: bàn phím iPhone/Android tự chuyển giọng nói thành chữ.
          </FieldDescription>
        </Field>
      </section>

      <Button type="button" variant="outline" className="w-full" onClick={() => void copyReport()}>
        <CopyIcon />
        Sao chép kết quả
      </Button>
    </div>
  )
}
