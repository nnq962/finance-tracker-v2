"use client"

import * as React from "react"

import { speechEngineAction, transcribeAction } from "@/lib/speech/actions"
import { normalizeTranscript } from "@/lib/speech/normalize"

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
  /** The recording is being turned into words (on the server only). */
  transcribing: boolean
  transcript: string
  interim: string
  error: string | null
  start: () => void
  stop: () => void
  cancel: () => void
}

// Asked once per page load: whether the server has a recogniser.
let enginePromise: Promise<"server" | "browser"> | undefined

/**
 * Dictation in Vietnamese, the same on every browser: recorded and sent to
 * the server, whose recogniser (sherpa-onnx, else Whisper) knows bank names
 * and sums far better than the browsers' own; through the browser's
 * recogniser only when the server has none. Either way the whole transcript
 * goes to `onEnd` once done. When the server's cannot be had, the browser's
 * takes over for the rest of the visit, if there is one.
 */
export function useSpeechRecognition({ onEnd }: { onEnd: (transcript: string) => void }): Dictation {
  const [engine, setEngine] = React.useState<"server" | "browser">("browser")
  // Why the recogniser changed, until the next try.
  const [notice, setNotice] = React.useState<string | null>(null)
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
  const fallBack = React.useCallback((): boolean => {
    if (getRecognitionConstructor() === null) return false
    enginePromise = Promise.resolve("browser")
    setEngine("browser")
    setNotice("Vui lòng nói lại: đã chuyển sang nhận dạng giọng nói của trình duyệt.")
    return true
  }, [])
  const server = useServerRecognition({ onEnd, onFallback: fallBack })
  const active = engine === "server" && server.supported ? server : browser
  return {
    ...active,
    error: active.error ?? notice,
    start: () => {
      setNotice(null)
      active.start()
    },
  }
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
      // The bank and wallet names it steadily mishears, put right as the server's are.
      const heard = normalizeTranscript(finals)
      setTranscript(heard)
      if (!cancelled.current) onEndRef.current(heard)
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
const MAX_RECORDING_MS = 15_000
/** Quiet after speech before the recording ends by itself, as in the voice lab's sentence test. */
const SILENCE_MS = 1_500
/** No speech heard this long from the start: ended, and nothing sent. */
const NO_SPEECH_MS = 6_000
/** Above this level (RMS) the microphone hears speech. */
const SPEECH_LEVEL = 0.03

/**
 * Watches the microphone's level and calls `onQuiet` once the speech is over
 * (or never came). `heard` tells whether there was speech; `measured`, whether
 * the level could be read at all: Safari may keep an audio context suspended,
 * and then nothing can be told, and the recording is sent as it is.
 */
function watchForSilence(stream: MediaStream, onQuiet: () => void) {
  const context = new AudioContext()
  const analyser = context.createAnalyser()
  analyser.fftSize = 1024
  context.createMediaStreamSource(stream).connect(analyser)
  void context.resume().catch(() => undefined)
  const samples = new Float32Array(analyser.fftSize)
  const startedAt = performance.now()
  let lastLoud = 0
  let loudFrames = 0
  let heard = false
  let measured = false
  const timer = window.setInterval(() => {
    if (context.state !== "running") return
    measured = true
    analyser.getFloatTimeDomainData(samples)
    const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length)
    const now = performance.now()
    // Two loud readings in a row, so a tap on the phone is not taken for speech.
    loudFrames = rms > SPEECH_LEVEL ? loudFrames + 1 : 0
    if (loudFrames >= 2) {
      heard = true
      lastLoud = now
    }
    if ((heard && now - lastLoud > SILENCE_MS) || (!heard && now - startedAt > NO_SPEECH_MS)) onQuiet()
  }, 100)
  return {
    heard: () => heard,
    measured: () => measured,
    stop: () => {
      window.clearInterval(timer)
      void context.close().catch(() => undefined)
    },
  }
}

function recorderSupported() {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia)
}

/** The first format this browser records in: Opus in WebM, or AAC in MP4 on Apple's. */
/** Bits per second a recording is made at; the recognisers hear speech as well at this as at ten times more. */
const SPEECH_BITRATE = 24_000

function recordingFormat() {
  const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((candidate) =>
    MediaRecorder.isTypeSupported(candidate),
  )
  return { type, extension: type?.startsWith("audio/mp4") ? "m4a" : "webm" }
}

/**
 * Dictation recorded from the microphone and sent to the server when stopped.
 * Nothing shows while speaking; the words arrive in one piece afterwards.
 */
function useServerRecognition({
  onEnd,
  onFallback,
}: {
  onEnd: (transcript: string) => void
  /** The server's recogniser cannot be had for now; true when the browser's took over. */
  onFallback: () => boolean
}): Dictation {
  const supported = React.useSyncExternalStore(subscribe, recorderSupported, () => false)
  const [listening, setListening] = React.useState(false)
  const [transcribing, setTranscribing] = React.useState(false)
  const [transcript, setTranscript] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const recorder = React.useRef<MediaRecorder | null>(null)
  // Tells the recording still wanted from one cancelled; a new one replaces it.
  const session = React.useRef<object | null>(null)
  const onEndRef = React.useRef(onEnd)
  const onFallbackRef = React.useRef(onFallback)
  React.useEffect(() => {
    onEndRef.current = onEnd
    onFallbackRef.current = onFallback
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
    // Ends by itself once the speaker stops, as a tap on stop would.
    const silence = watchForSilence(stream, () => {
      if (recorder.current === current) release()
    })

    current.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    })
    current.addEventListener("stop", async () => {
      window.clearTimeout(limit)
      silence.stop()
      stream.getTracks().forEach((track) => track.stop())
      if (recorder.current === current) recorder.current = null
      setListening(false)
      if (session.current !== token) return
      // A tap on and off again, or a recording the level says held no speech,
      // holds no words, and is not worth a request.
      if (Date.now() - startedAt < 600 || chunks.length === 0 || (silence.measured() && !silence.heard())) {
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
          // Taken over by the browser's recogniser, which says so itself.
          if (result.fallback && onFallbackRef.current()) setError(null)
          else setError(result.error)
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
