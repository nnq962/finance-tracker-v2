// The Web Speech API's recogniser; TypeScript's DOM types lack its constructor.
export type Recognition = EventTarget & {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
}
export type RecognitionEvent = Event & {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }>
}
export type RecognitionErrorEvent = Event & { error: string; message?: string }

export function getRecognitionConstructor() {
  if (typeof window === "undefined") return null
  const scope = window as unknown as Record<string, (new () => Recognition) | undefined>
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}
