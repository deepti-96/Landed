'use client'
import { useState, useEffect, useRef } from 'react'
import { StepWithStatus, UserProfile } from '@/lib/types'
import { X, ExternalLink, Mail, Copy, Check, Loader2 } from 'lucide-react'

interface Props {
  step: StepWithStatus
  profile: UserProfile
  open: boolean
  onClose: () => void
}

const DRAFT_TYPES = [
  { value: 'dso_email', label: 'Email to DSO' },
  { value: 'landlord_email', label: 'Email to landlord' },
  { value: 'bank_inquiry', label: 'Email to bank' },
]

export default function StepDrawer({ step, profile, open, onClose }: Props) {
  const [explanation, setExplanation] = useState('')
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [showDraft, setShowDraft] = useState(false)
  const [draftType, setDraftType] = useState('dso_email')
  const [draft, setDraft] = useState('')
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [copied, setCopied] = useState(false)
  const explanationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && step) {
      setExplanation('')
      setDraft('')
      setShowDraft(false)
      loadExplanation()
    }
  }, [open, step?.id])

  const loadExplanation = async () => {
    setLoadingExplanation(true)
    try {
      const res = await fetch('/api/explain-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, profile }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setExplanation(text)
        // Auto-scroll
        if (explanationRef.current) {
          explanationRef.current.scrollTop = explanationRef.current.scrollHeight
        }
      }
    } catch (e) {
      setExplanation('Failed to load explanation. Check your API key.')
    } finally {
      setLoadingExplanation(false)
    }
  }

  const loadDraft = async () => {
    setLoadingDraft(true)
    setDraft('')
    try {
      const res = await fetch('/api/draft-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: draftType, profile, step }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setDraft(text)
      }
    } catch (e) {
      setDraft('Failed to generate draft.')
    } finally {
      setLoadingDraft(false)
    }
  }

  const copyDraft = () => {
    navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format markdown-style bold and bullets simply
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-slate-950">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex-1 pr-4">
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${
              step.status === 'available' ? 'bg-blue-50 text-blue-600 dark:bg-sky-950/60 dark:text-sky-300' :
              step.status === 'done' ? 'bg-green-50 text-green-600 dark:bg-emerald-950/60 dark:text-emerald-300' :
              'bg-gray-100 text-gray-500 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {step.status === 'available' ? 'Do now' : step.status === 'done' ? 'Completed' : 'Blocked'}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 leading-tight dark:text-slate-100">{step.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div ref={explanationRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Explanation */}
          <div>
            {loadingExplanation && !explanation && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading explanation...
              </div>
            )}
            {explanation && (
              <div
                className="text-sm text-gray-700 leading-relaxed prose-sm dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: formatText(explanation) }}
              />
            )}
          </div>

          {/* Forms */}
          {step.forms && step.forms.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4 dark:bg-slate-900">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wide mb-2">Forms needed</p>
              <div className="flex flex-wrap gap-2">
                {step.forms.map(form => (
                  <span key={form} className="text-sm font-mono bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                    {form}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Official link */}
          {step.official_link && (
            <a
              href={step.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-sky-300 dark:hover:text-sky-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Official resource
            </a>
          )}

          {/* Draft section */}
          {!showDraft ? (
            <button
              onClick={() => setShowDraft(true)}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
            >
              <Mail className="w-4 h-4" />
              Draft an email for this step
            </button>
          ) : (
            <div className="border border-gray-200 rounded-2xl overflow-hidden dark:border-slate-700">
              <div className="p-4 border-b border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wide mb-3">Draft type</p>
                <div className="flex flex-wrap gap-2">
                  {DRAFT_TYPES.map(dt => (
                    <button
                      key={dt.value}
                      onClick={() => setDraftType(dt.value)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        draftType === dt.value
                          ? 'bg-gray-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={loadDraft}
                  disabled={loadingDraft}
                  className="mt-3 w-full bg-gray-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loadingDraft ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                  ) : (
                    'Generate draft'
                  )}
                </button>
              </div>

              {draft && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wide">Your draft</p>
                    <button
                      onClick={copyDraft}
                      className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans dark:text-slate-200">
                    {draft}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
