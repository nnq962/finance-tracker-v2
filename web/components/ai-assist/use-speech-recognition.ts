"use client"

import * as React from "react"

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

/**
 * Dictation in Vietnamese through the browser's recogniser. It keeps
 * listening until stopped (iOS only transcribes in continuous mode), then
 * hands the whole transcript to `onEnd`.
 */
export function useSpeechRecognition({ onEnd }: { onEnd: (transcript: string) => void }) {
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

  return { supported, listening, transcript, interim, error, start, stop, cancel }
}
