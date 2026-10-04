"use client"

import * as React from "react"

import { speechEngineAction, transcribeAction } from "@/lib/speech/actions"

// The Web Speech API's recogniser; TypeScript's DOM types lack its constructor.
type Recognition = EventTarget & {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionEvent = Event & {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}
type RecognitionErrorEvent = Event & { error: string }

function getRecognitionConstructor() {
  if (typeof window === "undefined") return null
  const scope = window as unknown as Record<string, (new () => Recognition) | undefined>
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

const subscribe = () => () => {}

// What the usual recognition errors mean, in plain words.
const errorMessages: Record<string, string> = {
  "not-allowed": "Chưa cho phép dùng micro.",
  "service-not-allowed": "Trình duyệt không cho dùng nhận dạng giọng nói.",
  network: "Cần kết nối mạng để nhận dạng giọng nói.",
  "no-speech": "Không nghe thấy tiếng nói.",
  "audio-capture": "Không lấy được âm thanh từ micro.",
}

type Dictation = {
  supported: boolean
  listening: boolean
  /** The recording is being turned into words (Whisper only). */
  transcribing: boolean
  transcript: string
  interim: string
  error: string | null
  start: () => void
  stop: () => void
  cancel: () => void
}

// Asked once per page load: whether the server has Whisper.
let enginePromise: Promise<"whisper" | "browser"> | undefined

/**
 * Dictation in Vietnamese: recorded and sent to Whisper when the server has
 * it, which knows bank names far better, else through the browser's own
 * recogniser. Either way the whole transcript goes to `onEnd` once done.
 */
export function useSpeechRecognition({ onEnd }: { onEnd: (transcript: string) => void }): Dictation {
  const [engine, setEngine] = React.useState<"whisper" | "browser">("browser")
  React.useEffect(() => {
    let current = true
    enginePromise ??= speechEngineAction().catch(() => "browser" as const)
    enginePromise.then((value) => {
      if (current) setEngine(value)
    })
    return () => {
      current = false
    }
  }, [])
  const browser = useBrowserRecognition({ onEnd })
  const whisper = useWhisperRecognition({ onEnd })
  return engine === "whisper" && whisper.supported ? whisper : browser
}

/**
 * Dictation through the browser's recogniser. It keeps listening until
 * stopped (iOS only transcribes in continuous mode), then hands the whole
 * transcript to `onEnd`.
 */
function useBrowserRecognition({ onEnd }: { onEnd: (transcript: string) => void }): Dictation {
  const supported = React.useSyncExternalStore(
    subscribe,
    () => getRecognitionConstructor() !== null,
    () => false,
  )
  const [listening, setListening] = React.useState(false)
  const [transcript, setTranscript] = React.useState("")
  const [interim, setInterim] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const recognition = React.useRef<Recognition | null>(null)
  const cancelled = React.useRef(false)
  const onEndRef = React.useRef(onEnd)
  React.useEffect(() => {
    onEndRef.current = onEnd
  })

  React.useEffect(() => () => recognition.current?.abort(), [])

  const start = React.useCallback(() => {
    const Constructor = getRecognitionConstructor()
    if (!Constructor || recognition.current) return

    const recogniser = new Constructor()
    recogniser.lang = "vi-VN"
    recogniser.continuous = true
    recogniser.interimResults = true
    let finals = ""

    recogniser.addEventListener("result", (event) => {
      const { resultIndex, results } = event as RecognitionEvent
      let pending = ""
      for (let index = resultIndex; index < results.length; index++) {
        const result = results[index]
        if (result.isFinal) finals = `${finals} ${result[0].transcript}`.trim()
        else pending += result[0].transcript
      }
      setTranscript(finals)
      setInterim(pending)
    })
    recogniser.addEventListener("error", (event) => {
      const { error: code } = event as RecognitionErrorEvent
      if (code !== "aborted") setError(errorMessages[code] ?? "Không nhận dạng được giọng nói.")
    })
    recogniser.addEventListener("end", () => {
      recognition.current = null
      setListening(false)
      setInterim("")
      if (!cancelled.current) onEndRef.current(finals)
    })

    recognition.current = recogniser
    cancelled.current = false
    setTranscript("")
    setInterim("")
    setError(null)
    try {
      recogniser.start()
      setListening(true)
    } catch {
      recognition.current = null
      setError("Không bật được micro.")
    }
  }, [])

  const stop = React.useCallback(() => recognition.current?.stop(), [])
  const cancel = React.useCallback(() => {
    // Ends without handing over what was heard, and forgets it.
    cancelled.current = true
    recognition.current?.abort()
    setTranscript("")
    setInterim("")
    setError(null)
  }, [])

  return { supported, listening, transcribing: false, transcript, interim, error, start, stop, cancel }
}

/** A recording runs at most this long, then is sent as it is. */
const MAX_RECORDING_MS = 30_000

function recorderSupported() {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia)
}

/** The first format this browser records in: Opus in WebM, or AAC in MP4 on Apple's. */
/** Bits per second a recording is made at; Whisper hears speech as well at this as at ten times more. */
const SPEECH_BITRATE = 24_000

function recordingFormat() {
  const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((candidate) =>
    MediaRecorder.isTypeSupported(candidate),
  )
  return { type, extension: type?.startsWith("audio/mp4") ? "m4a" : "webm" }
}

/**
 * Dictation recorded from the microphone and sent to Whisper when stopped.
 * Nothing shows while speaking; the words arrive in one piece afterwards.
 */
function useWhisperRecognition({ onEnd }: { onEnd: (transcript: string) => void }): Dictation {
  const supported = React.useSyncExternalStore(subscribe, recorderSupported, () => false)
  const [listening, setListening] = React.useState(false)
  const [transcribing, setTranscribing] = React.useState(false)
  const [transcript, setTranscript] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const recorder = React.useRef<MediaRecorder | null>(null)
  // Tells the recording still wanted from one cancelled; a new one replaces it.
  const session = React.useRef<object | null>(null)
  const onEndRef = React.useRef(onEnd)
  React.useEffect(() => {
    onEndRef.current = onEnd
  })

  const release = React.useCallback(() => {
    const current = recorder.current
    recorder.current = null
    // Stopping hands over the last of the audio; the microphone is let go once it has.
    if (current && current.state !== "inactive") current.stop()
    else current?.stream.getTracks().forEach((track) => track.stop())
  }, [])

  React.useEffect(
    () => () => {
      session.current = null
      release()
    },
    [release],
  )

  const start = React.useCallback(async () => {
    if (recorder.current || !recorderSupported()) return
    const token = {}
    session.current = token
    setTranscript("")
    setError(null)

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
    } catch (reason) {
      const name = (reason as DOMException).name
      setError(
        name === "NotAllowedError" ? errorMessages["not-allowed"] : name === "NotFoundError" ? "Không tìm thấy micro." : errorMessages["audio-capture"],
      )
      return
    }
    if (session.current !== token) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    const format = recordingFormat()
    // Speech needs little: at 24 kbps a sentence is tens of KB, quick to send on a phone's uplink.
    const current = new MediaRecorder(stream, {
      ...(format.type ? { mimeType: format.type } : {}),
      audioBitsPerSecond: SPEECH_BITRATE,
    })
    const chunks: Blob[] = []
    const startedAt = Date.now()
    const limit = window.setTimeout(() => {
      if (recorder.current === current) release()
    }, MAX_RECORDING_MS)

    current.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    })
    current.addEventListener("stop", async () => {
      window.clearTimeout(limit)
      stream.getTracks().forEach((track) => track.stop())
      if (recorder.current === current) recorder.current = null
      setListening(false)
      if (session.current !== token) return
      // A tap on and off again holds no words, and is not worth a request.
      if (Date.now() - startedAt < 600 || chunks.length === 0) {
        setError(errorMessages["no-speech"])
        return
      }

      const audio = new Blob(chunks, { type: current.mimeType || format.type || "audio/webm" })
      const formData = new FormData()
      formData.append("audio", new File([audio], `speech.${format.extension}`, { type: audio.type }))
      setTranscribing(true)
      try {
        const result = await transcribeAction(formData)
        if (session.current !== token) return
        if (!result.success) {
          setError(result.error)
          return
        }
        setTranscript(result.text)
        onEndRef.current(result.text)
      } catch {
        if (session.current === token) setError("Không nhận dạng được giọng nói. Vui lòng thử lại.")
      } finally {
        if (session.current === token) setTranscribing(false)
      }
    })

    recorder.current = current
    current.start()
    setListening(true)
  }, [release])

  const stop = React.useCallback(() => release(), [release])
  const cancel = React.useCallback(() => {
    // Ends without sending what was recorded, and forgets it.
    session.current = null
    release()
    setListening(false)
    setTranscribing(false)
    setTranscript("")
    setError(null)
  }, [release])

  return {
    supported,
    listening,
    transcribing,
    transcript,
    interim: "",
    error,
    start: () => void start(),
    stop,
    cancel,
  }
}
