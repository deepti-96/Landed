'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { StepWithStatus, UserProfile } from '@/lib/types'
import { calculateDeadline } from '@/lib/deadlines'
import { getTaxGuidance } from '@/lib/tax'
import { getCurrentSession, getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase'
import { loadRoadmapFromLocalStorage, loadRoadmapFromSupabase, saveRoadmapToLocalStorage, saveRoadmapToSupabase } from '@/lib/roadmap-storage'
import DeadlineCard from '@/components/DeadlineCard'
import StepCard from '@/components/StepCard'
import StepDrawer from '@/components/StepDrawer'
import { AlertTriangle, ExternalLink, LogOut, Plane, RefreshCw } from 'lucide-react'

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
    const localRoadmap = loadRoadmapFromLocalStorage()

    if (localRoadmap) {
      setPlan(localRoadmap.plan)
      setProfile(localRoadmap.profile)
      setLoading(false)
    }

    const hydrate = async () => {
      if (!isSupabaseConfigured()) {
        if (!localRoadmap && isMounted) {
          setLoading(false)
          router.push('/')
        }
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        if (!localRoadmap && isMounted) {
          setLoading(false)
          router.push('/')
        }
        return
      }

      const currentSession = await getCurrentSession().catch(() => null)
      if (!isMounted) return

      setSession(currentSession)

      if (currentSession) {
        const savedRoadmap = await loadRoadmapFromSupabase(supabase, currentSession).catch(() => null)
        if (!isMounted) return

        if (savedRoadmap) {
          setPlan(savedRoadmap.plan)
          setProfile(savedRoadmap.profile)
          saveRoadmapToLocalStorage(savedRoadmap.profile, savedRoadmap.plan)
        } else if (localRoadmap) {
          void saveRoadmapToSupabase(supabase, currentSession, localRoadmap.profile, localRoadmap.plan).then(() => {
            if (isMounted) {
              setSaveMessage('Signed in. Your current roadmap has been saved.')
            }
          }).catch(() => null)
        }
      } else if (!localRoadmap) {
        setLoading(false)
        router.push('/')
        return
      }

      if (!localRoadmap) {
        setLoading(false)
      }
    }

    void hydrate()

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

  const deadlineSteps = plan.filter(s => s.deadline_days && s.deadline_trigger && profile)
  const doneSteps = plan.filter(s => s.status === 'done')
  const availableSteps = plan.filter(s => s.status === 'available')
  const blockedSteps = plan.filter(s => s.status === 'blocked')
  const taxGuidance = profile ? getTaxGuidance(profile) : null

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

        {taxGuidance && (
          <section className="mb-8">
            <div className={`rounded-2xl border p-5 ${taxGuidance.status === 'overdue' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <AlertTriangle className={`w-4 h-4 ${taxGuidance.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`} />
                    Tax filing for {taxGuidance.taxYear}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{taxGuidance.summary}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {taxGuidance.forms.map(form => (
                      <span key={form} className="text-xs font-medium rounded-full bg-white border border-gray-200 px-3 py-1 text-gray-700">
                        {form}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {taxGuidance.details.map(detail => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${taxGuidance.status === 'overdue' ? 'text-red-700' : 'text-amber-700'}`}>
                    {taxGuidance.status === 'overdue' ? 'Overdue' : 'Action needed'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Deadline: {taxGuidance.deadline}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {taxGuidance.officialLinks.map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </section>
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
