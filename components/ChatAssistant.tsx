'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { StepWithStatus, UserProfile } from '@/lib/types'
import { getCurrentSession } from '@/lib/supabase'
import { Loader2, Mic, MicOff, Send, Sparkles, Volume2, X } from 'lucide-react'

interface Props {
  profile: UserProfile
  plan: StepWithStatus[]
}

interface ChatMessage {
  role: 'assistant' | 'user'
  content: string
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition
    SpeechRecognition?: new () => SpeechRecognition
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onend: (() => void) | null
    onerror: (() => void) | null
    start: () => void
    stop: () => void
  }

  interface SpeechRecognitionEvent {
    results: {
      [index: number]: {
        [index: number]: {
          transcript: string
        }
      }
      length: number
    }
  }
}

const ASSISTANT_NAME = 'Aster'
const WELCOME_MESSAGE = `Hi, I'm ${ASSISTANT_NAME}. I can help you understand your roadmap, deadlines, paperwork, and what to do next.`

function AssistantAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`assistant-avatar ${compact ? 'assistant-avatar-compact' : ''}`}>
      <div className="assistant-avatar-core">
        <div className="assistant-avatar-face">
          <span className="assistant-eye" />
          <span className="assistant-eye" />
        </div>
        <span className="assistant-smile" />
      </div>
      <span className="assistant-orbit assistant-orbit-one" />
      <span className="assistant-orbit assistant-orbit-two" />
      <span className="assistant-spark assistant-spark-one" />
      <span className="assistant-spark assistant-spark-two" />
    </div>
  )
}

export default function ChatAssistant({ profile, plan }: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ])
  const [listening, setListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const availableSteps = useMemo(() => plan.filter(step => step.status === 'available'), [plan])
  const availableCount = availableSteps.length
  const nextStepTitle = availableSteps[0]?.title ?? 'your next move'
  const quickPrompts = useMemo(() => [
    `What should I do next?`,
    `Explain ${nextStepTitle}.`,
    'What documents should I gather right now?',
  ], [nextStepTitle])
  const hasVoiceInput = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    setVoiceEnabled(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1.06
    utterance.lang = 'en-US'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const sendMessage = async (prefilled?: string) => {
    const trimmed = (prefilled ?? input).trim()
    if (!trimmed || loading) return

    const nextMessages = [...messages, { role: 'user' as const, content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const session = await getCurrentSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error('No session')

      const res = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: trimmed,
          messages: nextMessages,
          profile,
          plan,
        }),
      })

      if (!res.ok) throw new Error('Chat failed')

      const data = await res.json()
      setMessages(current => [...current, { role: 'assistant', content: data.reply }])
      speak(data.reply)
    } catch (_error) {
      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: 'I hit a snag answering that. Please make sure you are signed in and try again, or open one of your roadmap steps for more detail.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggleListening = () => {
    if (typeof window === 'undefined') return

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript || ''
      setInput(transcript)
    }
    recognition.onend = () => {
      setListening(false)
    }
    recognition.onerror = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  const replayLastAssistantMessage = () => {
    const lastAssistant = [...messages].reverse().find(message => message.role === 'assistant')
    if (lastAssistant) speak(lastAssistant.content)
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="assistant-launcher fixed bottom-24 right-5 z-40 w-[min(92vw,340px)] rounded-[30px] border border-sky-300 bg-white p-4 text-left shadow-2xl shadow-sky-200/80 ring-1 ring-white/80 backdrop-blur transition hover:-translate-y-1 dark:border-sky-500/40 dark:bg-slate-900 dark:shadow-black/45 dark:ring-sky-300/10"
        >
          <div className="flex items-center gap-4">
            <AssistantAvatar compact />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ASSISTANT_NAME}</p>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                  assistant
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                I can help with your roadmap, forms, deadlines, and what to do next.
              </p>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">{availableCount} step{availableCount === 1 ? '' : 's'} open now</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Next: {nextStepTitle}
                </span>
              </div>
            </div>
          </div>
        </button>
      )}

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[min(72vh,680px)] w-[min(94vw,390px)] flex-col overflow-hidden rounded-[32px] border border-sky-200 bg-white shadow-2xl shadow-slate-300/80 ring-1 ring-white/90 dark:border-sky-500/30 dark:bg-slate-950 dark:shadow-black/50 dark:ring-sky-300/10">
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <AssistantAvatar />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ASSISTANT_NAME}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your roadmap sidekick</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100">
              {WELCOME_MESSAGE}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.slice(1).map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'assistant'
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
                    : 'ml-auto bg-sky-100 text-sky-900 dark:bg-sky-800/70 dark:text-sky-50'
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Press enter to send</span>
              <div className="flex items-center gap-2">
                {voiceEnabled && (
                  <button
                    type="button"
                    onClick={replayLastAssistantMessage}
                    className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                    aria-label="Play voice reply"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
                {hasVoiceInput && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`rounded-xl border p-2 transition-colors ${
                      listening
                        ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100'
                    }`}
                    aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                  >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void sendMessage()
                  }
                }}
                rows={2}
                placeholder="Ask what to do next, what a step means, or what forms you need..."
                className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || loading}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
