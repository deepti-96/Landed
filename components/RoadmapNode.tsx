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
    ring: 'border-emerald-100 bg-white/80 opacity-65',
    dot: 'bg-emerald-500 ring-8 ring-emerald-50',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    label: 'Completed',
    labelClass: 'bg-emerald-50 text-emerald-700',
  },
  available: {
    ring: 'border-sky-200 bg-white shadow-sm shadow-sky-100/80 hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
    dot: 'bg-sky-500 ring-8 ring-sky-50',
    icon: <Sparkles className="h-4 w-4 text-sky-600" />,
    label: 'Do now',
    labelClass: 'bg-sky-50 text-sky-700',
  },
  blocked: {
    ring: 'border-slate-200 bg-slate-50/90 hover:border-slate-300 cursor-pointer',
    dot: 'bg-slate-300 ring-8 ring-slate-100',
    icon: <Lock className="h-4 w-4 text-slate-500" />,
    label: 'Locked',
    labelClass: 'bg-slate-200 text-slate-600',
  },
}

export default function RoadmapNode({ step, profile, isLast = false, onClick }: Props) {
  const deadline = step.deadline_days ? calculateDeadline(step, profile) : null
  const style = styles[step.status]
  const canClick = step.status !== 'done'

  return (
    <div className="relative pl-12">
      {!isLast && (
        <div className="absolute left-[15px] top-9 bottom-[-26px] w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />
      )}
      <div className={`absolute left-0 top-5 h-[30px] w-[30px] rounded-full ${style.dot}`} />
      <div
        onClick={canClick ? onClick : undefined}
        className={`rounded-3xl border p-5 transition-all ${style.ring}`}
      >
        <div className="flex items-start gap-4">
          <div className="mt-0.5 shrink-0">{style.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${style.labelClass}`}>
                {style.label}
              </span>
              {deadline && (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${deadline.urgency === 'red' ? 'bg-red-50 text-red-700' : deadline.urgency === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {deadline.urgency === 'red' ? 'Urgent' : deadline.urgency === 'amber' ? 'Upcoming' : 'On track'}
                </span>
              )}
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.status === 'blocked' && step.blocking_reason ? step.blocking_reason : step.description}
                </p>
                {step.id === 'opt_application' && profile.graduation_date && (
                  <p className="mt-2 text-xs text-slate-400">
                    Based on your graduation date of {formatDate(new Date(profile.graduation_date))}.
                  </p>
                )}
                {deadline && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {deadline.daysRemaining > 0 ? `${deadline.daysRemaining} days left` : 'Deadline reached'} · {formatDate(deadline.date)}
                  </div>
                )}
              </div>
              {canClick && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
