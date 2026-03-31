'use client'
import { formatDate } from '@/lib/deadlines'
import { UrgencyLevel } from '@/lib/types'
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'

interface Props {
  title: string
  daysRemaining: number
  date: Date
  urgency: UrgencyLevel
  onClick?: () => void
}

const styles = {
  red: {
    card: 'bg-red-50 border-red-200 hover:border-red-300 dark:bg-red-950/40 dark:border-red-900/50 dark:hover:border-red-800',
    days: 'text-red-600 dark:text-red-300',
    text: 'text-red-700 dark:text-red-200',
    muted: 'text-red-400 dark:text-red-300/80',
    icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
  },
  amber: {
    card: 'bg-amber-50 border-amber-200 hover:border-amber-300 dark:bg-amber-950/40 dark:border-amber-900/50 dark:hover:border-amber-800',
    days: 'text-amber-600 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-200',
    muted: 'text-amber-400 dark:text-amber-300/80',
    icon: <Clock className="w-4 h-4 text-amber-500" />,
  },
  green: {
    card: 'bg-green-50 border-green-200 hover:border-green-300 dark:bg-green-950/40 dark:border-green-900/50 dark:hover:border-green-800',
    days: 'text-green-600 dark:text-green-300',
    text: 'text-green-700 dark:text-green-200',
    muted: 'text-green-400 dark:text-green-300/80',
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
  },
}

export default function DeadlineCard({ title, daysRemaining, date, urgency, onClick }: Props) {
  const s = styles[urgency]

  return (
    <div
      onClick={onClick}
      className={`border rounded-2xl p-5 cursor-pointer transition-all ${s.card}`}
    >
      <div className="flex items-center gap-2 mb-3">
        {s.icon}
        <span className={`text-xs font-medium uppercase tracking-wide ${s.muted}`}>
          {urgency === 'red' ? 'Urgent' : urgency === 'amber' ? 'Coming up' : 'On track'}
        </span>
      </div>
      <p className={`text-3xl font-semibold ${s.days}`}>
        {daysRemaining > 0 ? `${daysRemaining}d` : 'Overdue'}
      </p>
      <p className={`text-sm font-medium mt-1 ${s.text}`}>{title}</p>
      <p className={`text-xs mt-2 ${s.muted}`}>{formatDate(date)}</p>
    </div>
  )
}
