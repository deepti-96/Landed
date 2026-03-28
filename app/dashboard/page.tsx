'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { StepWithStatus, UserProfile } from '@/lib/types'
import { calculateDeadline } from '@/lib/deadlines'
import { getCurrentSession, getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase'
import { loadRoadmapFromLocalStorage, loadRoadmapFromSupabase, saveRoadmapToLocalStorage, saveRoadmapToSupabase } from '@/lib/roadmap-storage'
import DeadlineCard from '@/components/DeadlineCard'
import StepCard from '@/components/StepCard'
import StepDrawer from '@/components/StepDrawer'
import { LogOut, Plane, RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [plan, setPlan] = useState<StepWithStatus[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedStep, setSelectedStep] = useState<StepWithStatus | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const hydrate = async () => {
      const localRoadmap = loadRoadmapFromLocalStorage()
      if (localRoadmap && isMounted) {
        setPlan(localRoadmap.plan)
        setProfile(localRoadmap.profile)
      }

      if (!isSupabaseConfigured()) {
        if (!localRoadmap && isMounted) router.push('/')
        if (isMounted) setLoading(false)
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        if (!localRoadmap && isMounted) router.push('/')
        if (isMounted) setLoading(false)
        return
      }

      const currentSession = await getCurrentSession().catch(() => null)
      if (!isMounted) return

      setSession(currentSession)

      if (currentSession) {
        const savedRoadmap = await loadRoadmapFromSupabase(supabase, currentSession).catch(() => null)
        if (savedRoadmap) {
          setPlan(savedRoadmap.plan)
          setProfile(savedRoadmap.profile)
          saveRoadmapToLocalStorage(savedRoadmap.profile, savedRoadmap.plan)
        } else if (localRoadmap) {
          await saveRoadmapToSupabase(supabase, currentSession, localRoadmap.profile, localRoadmap.plan).catch(() => null)
          setSaveMessage('Signed in. Your current roadmap has been saved.')
        }
      } else if (!localRoadmap) {
        router.push('/')
      }

      setLoading(false)
    }

    hydrate()

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return () => {
      isMounted = false
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      setSession(nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
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

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    await supabase.auth.signOut()
    setSession(null)
    setSaveMessage('Signed out. Your latest local roadmap remains on this device.')
  }

  if (loading || !plan.length || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Landed</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-end">
            <span className="text-sm text-gray-500">
              {profile.visa_type} · {profile.country_of_origin}
            </span>
            {session ? (
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            ) : (
              <span className="text-xs text-gray-400">
                {isSupabaseConfigured() ? 'Not signed in' : 'Supabase not configured'}
              </span>
            )}
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
        {saveMessage && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {saveMessage}
          </div>
        )}

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
