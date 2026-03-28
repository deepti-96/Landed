'use client'
import { StepWithStatus, UserProfile } from '@/lib/types'
import { calculateDeadline, formatDate } from '@/lib/deadlines'
import { CheckCircle2, Circle, Lock, ChevronRight, AlertTriangle } from 'lucide-react'

interface Props {
  step: StepWithStatus
  profile: UserProfile
  onClick: () => void
}

const statusConfig = {
  done: {
    card: 'bg-white border-gray-100 opacity-60',
    icon: <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />,
    badge: null,
  },
  available: {
    card: 'bg-white border-gray-200 hover:border-gray-400 hover:shadow-sm cursor-pointer',
    icon: <Circle className="w-5 h-5 text-blue-500 flex-shrink-0" />,
    badge: <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Do now</span>,
  },
  blocked: {
    card: 'bg-gray-50 border-gray-100 cursor-pointer hover:border-gray-300',
    icon: <Lock className="w-5 h-5 text-gray-300 flex-shrink-0" />,
    badge: <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Blocked</span>,
  },
}

export default function StepCard({ step, profile, onClick }: Props) {
  const config = statusConfig[step.status]
  const deadline = step.deadline_days ? calculateDeadline(step, profile) : null

  return (
    <div
      onClick={step.status !== 'done' ? onClick : undefined}
      className={`border rounded-2xl p-5 transition-all ${config.card}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-medium text-gray-900 text-sm">{step.title}</p>
            {config.badge}
            {deadline && deadline.urgency === 'red' && (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {deadline.daysRemaining}d left
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {step.status === 'blocked' && step.blocking_reason
              ? step.blocking_reason
              : step.description}
          </p>
          {step.id === 'opt_application' && profile.graduation_date && (
            <p className="text-[11px] text-gray-400 mt-2">
              Based on your graduation date of {formatDate(new Date(profile.graduation_date))}.
            </p>
          )}
        </div>
        {step.status !== 'done' && (
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
        )}
      </div>
    </div>
  )
}
