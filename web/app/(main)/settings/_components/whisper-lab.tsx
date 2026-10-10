"use client"

import * as React from "react"
import { MicIcon, RotateCcwIcon, SquareIcon } from "lucide-react"
import { toast } from "sonner"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Spinner } from "@/components/ui/spinner"
import { transcribeLabAction } from "@/lib/speech/actions"

/** One run through Whisper, timed at each step. */
export type WhisperRun = {
  model: string
  /** Sent with the prompt that spells the amounts and the banks. */
  withPrompt: boolean
  format: string
  bytes: number
  recordMs: number
  /** From tapping stop until the recorder handed over the audio. */
  flushMs: number
  /** From sending the audio until the words came back, on this device. */
  roundTripMs: number
  serverMs?: number
  accountsMs?: number
  groqMs?: number
  groqProcessingMs?: number
  pingMs?: number
  region?: string
  text?: string
  rawText?: string
  segments?: { text: string; no_speech_prob: number; avg_logprob: number }[]
  prompt?: string
  error?: string
}

/** Bits per second a recording is made at; Whisper hears speech as well at this as at ten times more. */
const SPEECH_BITRATE = 24_000

function recordingFormat() {
  const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((candidate) =>
    MediaRecorder.isTypeSupported(candidate),
  )
  return { type, extension: type?.startsWith("audio/mp4") ? "m4a" : "webm" }
}

const ms = (value?: number) => (value === undefined ? "—" : `${value.toLocaleString("vi-VN")} ms`)

/**
 * Records like the assistant does and sends it to Whisper on Groq, timing
 * each step: the recording, the trip to the server and back, and on the
 * server the call to Groq next to a bare round trip to it. Shows where the
 * wait comes from.
 */
export function WhisperLab({ onRun }: { onRun: (run: WhisperRun) => void }) {
  const [state, setState] = React.useState<"idle" | "recording" | "sending">("idle")
  const [model, setModel] = React.useState<string>("whisper-large-v3-turbo")
  const [withPrompt, setWithPrompt] = React.useState(true)
  const [run, setRun] = React.useState<WhisperRun | null>(null)
  const recorder = React.useRef<MediaRecorder | null>(null)
  const [last, setLast] = React.useState<{ file: File; recordMs: number; flushMs: number } | null>(null)

  React.useEffect(
    () => () => {
      const current = recorder.current
      if (current && current.state !== "inactive") current.stop()
    },
    [],
  )

  async function send(file: File, recordMs: number, flushMs: number) {
    setState("sending")
    const formData = new FormData()
    formData.append("audio", file)
    formData.append("model", model)
    if (!withPrompt) formData.append("prompt", "off")
    const sentAt = performance.now()
    const base = { model, withPrompt, format: file.type, bytes: file.size, recordMs, flushMs }
    let next: WhisperRun
    try {
      const result = await transcribeLabAction(formData)
      const roundTripMs = Math.round(performance.now() - sentAt)
      next = result.success
        ? {
            ...base,
            roundTripMs,
            serverMs: result.serverMs,
            accountsMs: result.accountsMs,
            groqMs: result.detail.groqMs,
            groqProcessingMs: result.detail.groqProcessingMs,
            pingMs: result.pingMs,
            region: result.detail.region,
            text: result.detail.text,
            rawText: result.detail.rawText,
            segments: result.detail.segments,
            prompt: result.prompt,
          }
        : { ...base, roundTripMs, error: result.error }
    } catch (error) {
      next = { ...base, roundTripMs: Math.round(performance.now() - sentAt), error: error instanceof Error ? error.message : String(error) }
    }
    setRun(next)
    onRun(next)
    setState("idle")
  }

  async function start() {
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
    // Speech needs little: at 24 kbps a sentence is tens of KB, quick to send on a phone's uplink.
    const current = new MediaRecorder(stream, {
      ...(format.type ? { mimeType: format.type } : {}),
      audioBitsPerSecond: SPEECH_BITRATE,
    })
    const chunks: Blob[] = []
    const startedAt = performance.now()
    let stoppedAt = 0
    current.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    })
    current.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop())
      recorder.current = null
      const flushMs = Math.round(performance.now() - stoppedAt)
      const recordMs = Math.round(stoppedAt - startedAt)
      const audio = new Blob(chunks, { type: current.mimeType || format.type || "audio/webm" })
      const file = new File([audio], `speech.${format.extension}`, { type: audio.type })
      setLast({ file, recordMs, flushMs })
      void send(file, recordMs, flushMs)
    })
    // Stopping is timed from the tap, so the recorder's own delay shows.
    const stop = current.stop.bind(current)
    current.stop = () => {
      stoppedAt = performance.now()
      stop()
    }
    recorder.current = current
    current.start()
    setState("recording")
  }

  // What the device waited for beyond the server's own work: the network both ways.
  const network = run?.serverMs !== undefined ? run.roundTripMs - run.serverMs : undefined
  // Groq's call beyond a bare round trip: sending the audio up, and the model.
  const upload =
    run?.groqMs !== undefined && run.pingMs !== undefined ? Math.max(0, run.groqMs - run.pingMs) : undefined

  return (
    <section className="space-y-3">
      <h3 className="px-3 text-sm font-medium text-muted-foreground">
        Nhận dạng giọng nói (Whisper · Groq)
      </h3>
      <ToggleGroup
        type="single"
        value={model}
        onValueChange={(value) => {
          if (value) setModel(value)
        }}
        className="flex-wrap"
        aria-label="Model"
        disabled={state !== "idle"}
      >
        <ToggleGroupItem value="whisper-large-v3-turbo">large-v3-turbo</ToggleGroupItem>
        <ToggleGroupItem value="whisper-large-v3">large-v3</ToggleGroupItem>
      </ToggleGroup>
      {/* With the same recording sent again (the button beside Ghi âm), shows what the prompt changes. */}
      <ToggleGroup
        type="single"
        value={withPrompt ? "on" : "off"}
        onValueChange={(value) => {
          if (value) setWithPrompt(value === "on")
        }}
        className="flex-wrap"
        aria-label="Prompt"
        disabled={state !== "idle"}
      >
        <ToggleGroupItem value="on">Có prompt</ToggleGroupItem>
        <ToggleGroupItem value="off">Không prompt</ToggleGroupItem>
      </ToggleGroup>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button
          type="button"
          variant={state === "recording" ? "destructive" : "default"}
          disabled={state === "sending"}
          onClick={() => (state === "recording" ? recorder.current?.stop() : void start())}
        >
          {state === "sending" ? <Spinner /> : state === "recording" ? <SquareIcon /> : <MicIcon />}
          {state === "sending" ? "Đang nhận dạng…" : state === "recording" ? "Dừng và gửi" : "Ghi âm"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Gửi lại đoạn vừa ghi"
          disabled={state !== "idle" || !last}
          onClick={() => last && void send(last.file, last.recordMs, last.flushMs)}
        >
          <RotateCcwIcon />
        </Button>
      </div>

      {run ? (
        <>
          <Field>
            <FieldLabel>Văn bản nhận được</FieldLabel>
            <Card size="sm">
              <CardContent>
                <p>{run.error ? <span className="text-destructive">{run.error}</span> : run.text || "—"}</p>
              </CardContent>
            </Card>
          </Field>

          <SettingsGroup
            title="Thời gian"
            footer="Mạng điện thoại ↔ máy chủ = tổng thời gian chờ trừ phần máy chủ xử lý. Phần còn lại của lệnh gọi Groq = lệnh gọi trừ độ trễ mạng tới Groq."
          >
            <SettingsRow title="Tổng thời gian chờ" description="Từ lúc gửi đến khi có chữ" value={ms(run.roundTripMs)} />
            <SettingsRow title="Mạng điện thoại ↔ máy chủ" value={ms(network)} />
            <SettingsRow title="Máy chủ xử lý" value={ms(run.serverMs)} />
            <SettingsRow title="· Đọc tài khoản (DB)" value={ms(run.accountsMs)} />
            <SettingsRow title="· Gọi Groq" description={run.region ? `Vùng ${run.region}` : undefined} value={ms(run.groqMs)} />
            <SettingsRow title="  – Độ trễ mạng tới Groq" value={ms(run.pingMs)} />
            <SettingsRow title="  – Gửi âm thanh và Groq xử lý" value={ms(upload)} />
            <SettingsRow title="Bấm dừng → có file" value={ms(run.flushMs)} />
          </SettingsGroup>

          <SettingsGroup title="Đoạn ghi âm">
            <SettingsRow title="Thời lượng" value={ms(run.recordMs)} />
            <SettingsRow title="Kích thước" value={`${(run.bytes / 1024).toFixed(1)} KB`} />
            <SettingsRow title="Định dạng" value={run.format || "—"} />
            <SettingsRow title="Model" value={run.model} />
            <SettingsRow title="Prompt" value={run.withPrompt ? "Có" : "Không"} />
          </SettingsGroup>

          {run.segments && run.segments.length > 0 ? (
            <SettingsGroup title="Các đoạn Whisper trả về">
              {run.segments.map((segment, index) => (
                <SettingsRow
                  key={index}
                  // Titles keep to one line, so the transcript goes in the description, in full.
                  title={`Đoạn ${index + 1} · im lặng ${Math.round(segment.no_speech_prob * 100)}% · logprob ${segment.avg_logprob.toFixed(2)}`}
                  description={segment.text.trim() || "—"}
                  fullDescription
                />
              ))}
            </SettingsGroup>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
