'use client'
import { StepWithStatus, UserProfile } from '@/lib/types'
import { calculateDeadline, formatDate } from '@/lib/deadlines'
import { AlertTriangle, CheckCircle2, ChevronRight, Lock, Sparkles } from 'lucide-react'

interface Props {
  step: StepWithStatus
  profile: UserProfile
  isLast?: boolean
  onClick: () => void
}

const styles = {
  done: {
    shell: 'border-emerald-200/80 bg-white/55 opacity-70 blur-[0.15px] dark:border-emerald-900/40 dark:bg-slate-950/45',
    glow: 'from-emerald-300/0 via-emerald-300/20 to-emerald-300/0 dark:via-emerald-500/10',
    dot: 'bg-emerald-500 ring-8 ring-emerald-100 dark:ring-emerald-950/70',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />,
    label: 'Completed',
    labelClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    prompt: 'This one is behind you now.',
  },
  available: {
    shell: 'border-sky-300 bg-white/92 shadow-[0_24px_50px_-30px_rgba(14,165,233,0.65)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-28px_rgba(14,165,233,0.55)] cursor-pointer dark:border-sky-800/70 dark:bg-slate-900/95 dark:shadow-[0_20px_40px_-24px_rgba(14,165,233,0.45)]',
    glow: 'from-sky-400/0 via-sky-300/30 to-cyan-300/0 dark:via-sky-500/15',
    dot: 'bg-sky-500 ring-8 ring-sky-100 dark:ring-sky-950/80',
    icon: <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-300" />,
    label: 'Do now',
    labelClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    prompt: 'This is the strongest move you can make right now.',
  },
  blocked: {
    shell: 'border-slate-200/90 bg-white/72 hover:border-slate-300 cursor-pointer dark:border-slate-800 dark:bg-slate-950/55 dark:hover:border-slate-700',
    glow: 'from-slate-300/0 via-slate-200/25 to-slate-300/0 dark:via-slate-700/15',
    dot: 'bg-slate-300 ring-8 ring-slate-100 dark:bg-slate-600 dark:ring-slate-900',
    icon: <Lock className="h-4 w-4 text-slate-500 dark:text-slate-300" />,
    label: 'Locked',
    labelClass: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    prompt: 'Visible now, unlocked a little later.',
  },
}

export default function RoadmapNode({ step, profile, isLast = false, onClick }: Props) {
  const deadline = step.deadline_days ? calculateDeadline(step, profile) : null
  const style = styles[step.status]
  const canClick = step.status !== 'done'

  return (
    <div className="relative pl-12 sm:pl-14">
      {!isLast && (
        <div className="absolute left-[17px] top-12 bottom-[-30px] w-[2px] rounded-full bg-gradient-to-b from-slate-200 via-slate-200/80 to-transparent dark:from-slate-800 dark:via-slate-800/70" />
      )}
      <div className={`absolute left-0 top-6 h-[34px] w-[34px] rounded-full ${style.dot} ${step.status === 'available' ? 'journey-node-pulse' : ''}`} />
      <div
        onClick={canClick ? onClick : undefined}
        className={`group relative overflow-hidden rounded-[30px] border p-5 transition-all duration-300 ${style.shell}`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r ${style.glow}`} />
        <div className="relative flex items-start gap-4">
          <div className="mt-0.5 shrink-0 rounded-2xl border border-white/70 bg-white/80 p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            {style.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${style.labelClass}`}>
                {style.label}
              </span>
              <span className="rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                {style.prompt}
              </span>
              {deadline && (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${deadline.urgency === 'red' ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300' : deadline.urgency === 'amber' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                  {deadline.urgency === 'red' ? 'Urgent' : deadline.urgency === 'amber' ? 'Upcoming' : 'On track'}
                </span>
              )}
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="max-w-2xl">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {step.status === 'blocked' && step.blocking_reason ? step.blocking_reason : step.description}
                </p>
                {step.id === 'opt_application' && profile.graduation_date && (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    Based on your graduation date of {formatDate(new Date(profile.graduation_date))}.
                  </p>
                )}
                {deadline && (
                  <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {deadline.daysRemaining > 0 ? `${deadline.daysRemaining} days left` : 'Deadline reached'} · {formatDate(deadline.date)}
                  </div>
                )}
              </div>
              {canClick && (
                <div className="mt-1 flex shrink-0 items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-500 transition group-hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 dark:group-hover:text-slate-100">
                  Open
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
