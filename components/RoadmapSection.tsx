'use client'
import { StepWithStatus, UserProfile } from '@/lib/types'
import RoadmapNode from '@/components/RoadmapNode'

interface Props {
  title: string
  subtitle: string
  steps: StepWithStatus[]
  profile: UserProfile
  onStepClick: (step: StepWithStatus) => void
}

export default function RoadmapSection({ title, subtitle, steps, profile, onStepClick }: Props) {
  if (!steps.length) return null

  const completed = steps.filter(step => step.status === 'done').length

  return (
    <section className="relative rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/40 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Milestone</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{completed}</span> of <span className="font-semibold text-slate-900 dark:text-slate-100">{steps.length}</span> completed
        </div>
      </div>
      <div className="space-y-6">
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
