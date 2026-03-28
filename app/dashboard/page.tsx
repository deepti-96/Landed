'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepWithStatus, UserProfile } from '@/lib/types'
import { calculateDeadline, formatDate } from '@/lib/deadlines'
import DeadlineCard from '@/components/DeadlineCard'
import StepCard from '@/components/StepCard'
import StepDrawer from '@/components/StepDrawer'
import { Plane, RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [plan, setPlan] = useState<StepWithStatus[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedStep, setSelectedStep] = useState<StepWithStatus | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const storedPlan = localStorage.getItem('landed_plan')
    const storedProfile = localStorage.getItem('landed_profile')
    if (!storedPlan || !storedProfile) {
      router.push('/')
      return
    }
    setPlan(JSON.parse(storedPlan))
    setProfile(JSON.parse(storedProfile))
  }, [router])

  const deadlineSteps = plan.filter(s =>
    s.deadline_days && s.deadline_trigger && profile
  )

  const doneSteps = plan.filter(s => s.status === 'done')
  const availableSteps = plan.filter(s => s.status === 'available')
  const blockedSteps = plan.filter(s => s.status === 'blocked')

  const handleStepClick = (step: StepWithStatus) => {
    setSelectedStep(step)
    setDrawerOpen(true)
  }

  if (!plan.length || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Landed</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {profile.visa_type} · {profile.country_of_origin}
            </span>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update profile
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Deadline section */}
        {deadlineSteps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Your deadlines
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deadlineSteps.map(step => {
                const deadline = profile ? calculateDeadline(step, profile) : null
                if (!deadline) return null
                return (
                  <DeadlineCard
                    key={step.id}
                    title={step.title}
                    daysRemaining={deadline.daysRemaining}
                    date={deadline.date}
                    urgency={deadline.urgency}
                    onClick={() => handleStepClick(step)}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* Progress summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">{doneSteps.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completed</p>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="text-center">
            <p className="text-2xl font-semibold text-blue-600">{availableSteps.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Do now</p>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-400">{blockedSteps.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Blocked</p>
          </div>
          <div className="flex-1 ml-4">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gray-900 h-2 rounded-full transition-all"
                style={{ width: `${(doneSteps.length / plan.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((doneSteps.length / plan.length) * 100)}% complete
            </p>
          </div>
        </div>

        {/* Do now */}
        {availableSteps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Do now
            </h2>
            <div className="space-y-3">
              {availableSteps.map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  profile={profile}
                  onClick={() => handleStepClick(step)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Blocked */}
        {blockedSteps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Blocked
            </h2>
            <div className="space-y-3">
              {blockedSteps.map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  profile={profile}
                  onClick={() => handleStepClick(step)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Done */}
        {doneSteps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Completed
            </h2>
            <div className="space-y-3">
              {doneSteps.map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  profile={profile}
                  onClick={() => handleStepClick(step)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Step drawer */}
      {selectedStep && (
        <StepDrawer
          step={selectedStep}
          profile={profile}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}
