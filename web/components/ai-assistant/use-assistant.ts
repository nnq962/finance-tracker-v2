"use client"

import * as React from "react"

import { useSpeechRecognition } from "@/components/ai-assist/use-speech-recognition"
import { askAssistantAction } from "@/lib/ai/assistant/actions"
import type { AssistantContext, AssistantReply } from "@/lib/ai/assistant/types"

export type AssistantPhase = "idle" | "listening" | "transcribing" | "thinking" | "result"

/** What a turn ends in: the server's reply, or the microphone's word on why nothing was heard. */
export type TurnReply = AssistantReply | { kind: "unheard"; message: string }

export type AssistantTurn = { id: number; said: string; reply: TurnReply }

/**
 * The assistant's state, from speaking or typing to the answer. A question
 * is asked with the one answered before it, so a follow-up ("còn tháng
 * trước?") is read in its light; that is forgotten when the assistant closes.
 */
export function useAssistant() {
  const [phase, setPhase] = React.useState<"idle" | "thinking" | "result">("idle")
  const [turn, setTurn] = React.useState<AssistantTurn | null>(null)
  const [asked, setAsked] = React.useState<{ id: number; said: string } | null>(null)
  const [context, setContext] = React.useState<AssistantContext | null>(null)
  // A recording under way, so a failure of the microphone shows as its turn.
  const [voice, setVoice] = React.useState<{ id: number } | null>(null)
  const ids = React.useRef(0)
  // The question being waited for; a reply to any other is dropped.
  const awaited = React.useRef(0)

  const ask = (text: string) => {
    const said = text.trim()
    if (!said) return
    const id = ++ids.current
    awaited.current = id
    setVoice(null)
    setAsked({ id, said })
    setPhase("thinking")
    askAssistantAction(said, context ?? undefined).then(
      (reply) => {
        if (awaited.current !== id) return
        setTurn({ id, said, reply })
        setPhase("result")
        if (reply.kind === "answer") setContext({ question: said, plan: reply.plan })
        if (reply.kind === "chat" && !reply.limited) setContext({ question: said, reply: reply.text })
      },
      () => {
        if (awaited.current !== id) return
        setTurn({ id, said, reply: { kind: "failed" } })
        setPhase("result")
      },
    )
  }

  const speech = useSpeechRecognition({
    onEnd: (text) => {
      if (text.trim()) ask(text)
      else {
        setVoice(null)
        setTurn({ id: ++ids.current, said: "", reply: { kind: "unheard", message: "Mình chưa nghe thấy gì." } })
        setPhase("result")
      }
    },
  })

  const speaking = speech.listening || speech.transcribing
  // The microphone stopped with a reason and no words: that is the turn.
  const voiceError = voice && !speaking && speech.error ? speech.error : null

  const listen = () => {
    awaited.current = 0
    setVoice({ id: ++ids.current })
    speech.start()
  }

  // Stopping while it thinks drops the question and goes back to what was there.
  const cancel = () => {
    awaited.current = 0
    setAsked(null)
    setPhase(turn ? "result" : "idle")
  }

  const reset = () => {
    speech.cancel()
    awaited.current = 0
    setPhase("idle")
    setTurn(null)
    setAsked(null)
    setContext(null)
    setVoice(null)
  }

  return {
    phase: (speech.listening ? "listening" : speech.transcribing ? "transcribing" : voiceError ? "result" : phase) as AssistantPhase,
    turn: voiceError && voice ? { id: voice.id, said: "", reply: { kind: "unheard", message: voiceError } as TurnReply } : turn,
    asked,
    /** The voice's level, 0 to 1, read each frame; null with the browser's recogniser, which shows the words instead. */
    level: speech.level,
    heard: `${speech.transcript} ${speech.interim}`.trim(),
    canListen: speech.supported,
    ask,
    listen,
    /** Ends the recording and sends what was said. */
    send: speech.stop,
    cancel,
    reset,
  }
}

export type Assistant = ReturnType<typeof useAssistant>
