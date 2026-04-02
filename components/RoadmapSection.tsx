'use client'
import { StepWithStatus, UserProfile } from '@/lib/types'
import RoadmapNode from '@/components/RoadmapNode'
import { Compass, Sparkles } from 'lucide-react'

interface Props {
  title: string
  subtitle: string
  steps: StepWithStatus[]
  profile: UserProfile
  sectionIndex: number
  onStepClick: (step: StepWithStatus) => void
}

const chapterThemes = [
  {
    shell: 'from-sky-100 via-white to-cyan-50 dark:from-sky-950/40 dark:via-slate-900 dark:to-cyan-950/20',
    accent: 'text-sky-700 dark:text-sky-300',
    badge: 'border-sky-200 bg-white/85 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300',
  },
  {
    shell: 'from-emerald-100 via-white to-teal-50 dark:from-emerald-950/35 dark:via-slate-900 dark:to-teal-950/20',
    accent: 'text-emerald-700 dark:text-emerald-300',
    badge: 'border-emerald-200 bg-white/85 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  {
    shell: 'from-amber-100 via-white to-orange-50 dark:from-amber-950/30 dark:via-slate-900 dark:to-orange-950/20',
    accent: 'text-amber-700 dark:text-amber-300',
    badge: 'border-amber-200 bg-white/85 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300',
  },
  {
    shell: 'from-fuchsia-100 via-white to-rose-50 dark:from-fuchsia-950/25 dark:via-slate-900 dark:to-rose-950/20',
    accent: 'text-fuchsia-700 dark:text-fuchsia-300',
    badge: 'border-fuchsia-200 bg-white/85 text-fuchsia-700 dark:border-fuchsia-800/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
  },
  {
    shell: 'from-indigo-100 via-white to-violet-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-violet-950/20',
    accent: 'text-indigo-700 dark:text-indigo-300',
    badge: 'border-indigo-200 bg-white/85 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
]

export default function RoadmapSection({ title, subtitle, steps, profile, sectionIndex, onStepClick }: Props) {
  if (!steps.length) return null

  const completed = steps.filter(step => step.status === 'done').length
  const available = steps.filter(step => step.status === 'available').length
  const theme = chapterThemes[sectionIndex % chapterThemes.length]
  const chapterLabel = String(sectionIndex + 1).padStart(2, '0')

  return (
    <section className={`journey-section relative overflow-hidden rounded-[36px] border border-white/70 bg-gradient-to-br ${theme.shell} p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800/80 dark:shadow-none sm:p-7`}>
      <div className="absolute inset-y-10 left-7 hidden w-px bg-gradient-to-b from-white/0 via-slate-200/80 to-white/0 dark:via-slate-800/90 lg:block" />
      <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-white/35 blur-3xl dark:bg-white/5" />

      <div className="relative mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] ${theme.badge}`}>
              <Compass className="h-3.5 w-3.5" />
              Chapter {chapterLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              <Sparkles className={`h-3.5 w-3.5 ${theme.accent}`} />
              {available > 0 ? `${available} move${available === 1 ? '' : 's'} ready now` : 'This chapter is waiting on earlier moves'}
            </span>
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[2.2rem]">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">{subtitle}</p>
        </div>

        <div className="grid max-w-sm grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Completed</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{completed}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Chapter state</p>
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              {completed === steps.length ? 'Cleared' : available > 0 ? 'In motion' : 'Locked'}
            </p>
          </div>
        </div>
      </div>

      <div className="relative space-y-6 lg:pl-10">
        {steps.map((step, index) => (
          <RoadmapNode
            key={step.id}
            step={step}
            profile={profile}
            isLast={index === steps.length - 1}
            onClick={() => onStepClick(step)}
          />
        ))}
      </div>
    </section>
  )
}
