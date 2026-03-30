'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { StepWithStatus, UserProfile } from '@/lib/types'
import { calculateDeadline } from '@/lib/deadlines'
import { getTaxGuidance } from '@/lib/tax'
import { getCurrentSession, getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase'
import { loadRoadmapFromLocalStorage, loadRoadmapFromSupabase, saveRoadmapToLocalStorage, saveRoadmapToSupabase } from '@/lib/roadmap-storage'
import DeadlineCard from '@/components/DeadlineCard'
import RoadmapSection from '@/components/RoadmapSection'
import StepDrawer from '@/components/StepDrawer'
import { AlertTriangle, Compass, ExternalLink, LogOut, Plane, RefreshCw, Sparkles, Target } from 'lucide-react'

const ROADMAP_SECTIONS = [
  {
    id: 'before-arrival',
    title: 'Before You Arrive',
    subtitle: 'Secure your school documents and pre-entry approvals before you move.',
    stepIds: ['i20', 'sevis_fee', 'visa_stamp'],
  },
  {
    id: 'arrival',
    title: 'Arrival In The U.S.',
    subtitle: 'Get your first-week arrival tasks done so your student record and address are in place.',
    stepIds: ['arrive_us', 'university_checkin', 'local_address'],
  },
  {
    id: 'identity-banking',
    title: 'Identity And Banking',
    subtitle: 'Set up the core identity and money systems that unlock everyday life in the U.S.',
    stepIds: ['ssn_on_campus', 'itin', 'bank_account'],
  },
  {
    id: 'credit',
    title: 'Credit Building',
    subtitle: 'Build the financial history that makes renting, credit cards, and future approvals easier.',
    stepIds: ['secured_credit_card', 'credit_history'],
  },
  {
    id: 'work',
    title: 'Work Authorization',
    subtitle: 'Track the work permissions and filing windows that matter later in your journey.',
    stepIds: ['cpt_authorization', 'opt_application', 'stem_opt'],
  },
]

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
    const profileUpdated = typeof window !== 'undefined' ? sessionStorage.getItem('landed_profile_updated') : null
    if (profileUpdated) {
      setSaveMessage('Profile updated. Your roadmap has been rebuilt with the latest answers.')
      sessionStorage.removeItem('landed_profile_updated')
    }

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

  const deadlineSteps = plan.filter(step => step.deadline_days && step.deadline_trigger && profile)
  const doneSteps = plan.filter(step => step.status === 'done')
  const availableSteps = plan.filter(step => step.status === 'available')
  const blockedSteps = plan.filter(step => step.status === 'blocked')
  const taxGuidance = profile ? getTaxGuidance(profile) : null
  const completionPercent = plan.length ? Math.round((doneSteps.length / plan.length) * 100) : 0
  const nextAction = availableSteps[0] ?? blockedSteps[0] ?? null

  const roadmapSections = useMemo(() => {
    const planMap = new Map(plan.map(step => [step.id, step]))

    return ROADMAP_SECTIONS.map(section => ({
      ...section,
      steps: section.stepIds.map(stepId => planMap.get(stepId)).filter(Boolean) as StepWithStatus[],
    })).filter(section => section.steps.length > 0)
  }, [plan])

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
        <div className="h-6 w-6 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef6ff,_#f8fafc_45%,_#f8fafc)]">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 shadow-sm shadow-slate-300/40">
              <Plane className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Landed</p>
              <p className="text-xs text-slate-500">{profile.visa_type} roadmap</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-end">
            <span className="text-sm text-slate-500">{profile.country_of_origin}</span>
            {session ? (
              <button
                onClick={handleSignOut}
                className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            ) : (
              <span className="text-xs text-slate-400">
                {isSupabaseConfigured() ? 'Not signed in' : 'Supabase not configured'}
              </span>
            )}
            <button
              onClick={() => {
                sessionStorage.setItem('landed_edit_profile', 'true')
                router.push('/')
              }}
              className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Update profile
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {saveMessage && (
          <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            {saveMessage}
          </div>
        )}

        <section className="mb-8 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50 backdrop-blur">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Your journey</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">A roadmap you can actually follow</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Work through the brightest cards first. Completed milestones recede into the background, and future milestones stay visible so you always know what unlocks next.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">Progress</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">{completionPercent}%</p>
              </div>
            </div>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-emerald-600 transition-all" style={{ width: `${completionPercent}%` }} />
              </div>
              <span className="text-sm text-slate-500">{doneSteps.length} / {plan.length} done</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-emerald-600">Completed</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-900">{doneSteps.length}</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-sky-600">Open now</p>
                <p className="mt-1 text-2xl font-semibold text-sky-900">{availableSteps.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Locked</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{blockedSteps.length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Target className="h-4 w-4 text-sky-600" />
                Next best move
              </div>
              {nextAction ? (
                <button onClick={() => handleStepClick(nextAction)} className="mt-4 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white">
                  <p className="text-sm font-semibold text-slate-900">{nextAction.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{nextAction.status === 'blocked' && nextAction.blocking_reason ? nextAction.blocking_reason : nextAction.description}</p>
                </button>
              ) : (
                <p className="mt-4 text-sm text-slate-500">You have cleared every visible milestone for now.</p>
              )}
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Momentum
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {doneSteps.length > 0
                  ? `You have already completed ${doneSteps.length} milestone${doneSteps.length === 1 ? '' : 's'}. Keep moving and the locked parts of the path will start opening up.`
                  : 'Start with your first bright milestone and this roadmap will unlock itself step by step.'}
              </p>
            </div>
          </div>
        </section>

        {taxGuidance && (
          <section className="mb-8">
            <div className={`rounded-[32px] border p-5 ${taxGuidance.status === 'overdue' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <AlertTriangle className={`h-4 w-4 ${taxGuidance.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`} />
                    Tax filing for {taxGuidance.taxYear}
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-slate-700">{taxGuidance.summary}</p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {taxGuidance.forms.map(form => (
                      <span key={form} className="rounded-full border border-white/80 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        {form}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {taxGuidance.details.map(detail => <li key={detail}>{detail}</li>)}
                  </ul>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${taxGuidance.status === 'overdue' ? 'text-red-700' : 'text-amber-700'}`}>
                    {taxGuidance.status === 'overdue' ? 'Overdue' : 'Action needed'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Deadline: {taxGuidance.deadline}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {taxGuidance.officialLinks.map(link => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {deadlineSteps.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Compass className="h-4 w-4" />
              Deadlines on your path
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

        <section className="space-y-8">
          {roadmapSections.map(section => (
            <RoadmapSection
              key={section.id}
              title={section.title}
              subtitle={section.subtitle}
              steps={section.steps}
              profile={profile}
              onStepClick={handleStepClick}
            />
          ))}
        </section>
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
