'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { UserProfile } from '@/lib/types'
import { getCurrentSession, getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase'
import { loadRoadmapFromLocalStorage, loadRoadmapFromSupabase, saveRoadmapToLocalStorage, saveRoadmapToSupabase } from '@/lib/roadmap-storage'
import { CheckCircle2, KeyRound, Mail, Plane } from 'lucide-react'

const VISA_TYPES = ['F-1', 'J-1', 'H-1B', 'O-1', 'L-1', 'Other']
const EMPLOYMENT_OPTIONS = [
  { value: 'none', label: 'Not working yet' },
  { value: 'on_campus', label: 'On-campus job' },
  { value: 'cpt', label: 'CPT (internship)' },
  { value: 'opt', label: 'OPT' },
  { value: 'stem_opt', label: 'STEM OPT' },
]
const LAST_TAX_YEAR = new Date().getFullYear() - 1

export default function IntakePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isReturningToEdit, setIsReturningToEdit] = useState(false)
  const editIntentRef = useRef(false)
  const [hasSavedRoadmap, setHasSavedRoadmap] = useState(false)
  const [isEditingSavedProfile, setIsEditingSavedProfile] = useState(false)
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    country_of_origin: 'United States',
    has_ssn: false,
    has_bank_account: false,
    has_mobile_number: false,
    has_address: false,
    has_itin: false,
    employment_status: 'none',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const editMode = sessionStorage.getItem('landed_edit_profile') === 'true'
    editIntentRef.current = editMode
    setIsReturningToEdit(editMode)

    if (editMode) {
      sessionStorage.removeItem('landed_edit_profile')
    }

    const localRoadmap = loadRoadmapFromLocalStorage()
    if (localRoadmap) {
      setHasSavedRoadmap(true)
      setProfile(localRoadmap.profile)

      if (editMode) {
        setIsEditingSavedProfile(true)
      } else {
        router.replace('/dashboard')
      }
    }
  }, [router])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthChecked(true)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    let isMounted = true

    getCurrentSession()
      .then(async currentSession => {
        if (!isMounted || !currentSession) return

        setSession(currentSession)
        setEmail(currentSession.user.email ?? '')

        const savedRoadmap = await loadRoadmapFromSupabase(supabase, currentSession).catch(() => null)
        if (!isMounted) return

        if (!savedRoadmap) {
          setHasSavedRoadmap(false)
          setAuthChecked(true)
          return
        }

        setHasSavedRoadmap(true)
        setProfile(savedRoadmap.profile)
        setAuthChecked(true)
        if (editIntentRef.current) {
          setIsEditingSavedProfile(true)
          setAuthMessage('Signed in. Your saved profile is ready to edit.')
        } else {
          setIsEditingSavedProfile(false)
          setAuthMessage('Signed in. Opening your dashboard...')
          router.replace('/dashboard')
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthMessage('Could not restore your session.')
          setAuthChecked(true)
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setAuthChecked(true)
        return
      }

      setEmail(nextSession.user.email ?? '')
      setCodeSent(false)
      setOtpCode('')
      const savedRoadmap = await loadRoadmapFromSupabase(supabase, nextSession).catch(() => null)
      if (savedRoadmap) {
        setHasSavedRoadmap(true)
        setProfile(savedRoadmap.profile)
        if (editIntentRef.current) {
          setIsEditingSavedProfile(true)
          setAuthMessage('Signed in. Your saved profile is ready to edit.')
        } else {
          setIsEditingSavedProfile(false)
          setAuthMessage('Signed in. Opening your dashboard...')
          router.replace('/dashboard')
        }
        setAuthChecked(true)
      } else {
        setHasSavedRoadmap(false)
        setIsEditingSavedProfile(false)
        setAuthMessage('Signed in. Fill out your profile to save your roadmap.')
        setAuthChecked(true)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const update = (key: keyof UserProfile, value: string | boolean) => {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  const sendCode = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setAuthMessage('Add your Supabase keys to enable email sign-in.')
      return
    }

    if (!email) {
      setAuthMessage('Enter your email first.')
      return
    }

    setAuthLoading(true)
    setAuthMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      setAuthMessage(error.message)
    } else {
      setCodeSent(true)
      setAuthMessage('A 6-digit sign-in code was sent to your email.')
    }

    setAuthLoading(false)
  }

  const verifyCode = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setAuthMessage('Add your Supabase keys to enable email sign-in.')
      return
    }

    if (!email || !otpCode) {
      setAuthMessage('Enter both your email and the 6-digit code.')
      return
    }

    setAuthLoading(true)
    setAuthMessage('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    })

    if (error) {
      setAuthMessage(error.message)
    } else {
      setAuthMessage('Code verified. Your profile is ready below.')
    }

    setAuthLoading(false)
  }

  const handleSubmit = async () => {
    if (!session) {
      setError('Please sign in with your email code first.')
      return
    }

    if (!profile.visa_type || !profile.country_of_origin || profile.currently_in_us === undefined) {
      setError('Please answer the required profile questions first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (!res.ok) throw new Error('API error')

      const { plan } = await res.json()
      saveRoadmapToLocalStorage(profile, plan)
      sessionStorage.setItem('landed_profile_updated', 'true')
      sessionStorage.removeItem('landed_edit_profile')
      router.push('/dashboard')

      const supabase = getSupabaseBrowserClient()
      if (supabase) {
        void saveRoadmapToSupabase(supabase, session, profile, plan).catch(error => {
          console.error('Background roadmap save failed:', error)
        })
      }
    } catch (_e) {
      setError('Something went wrong. Check your API key and Supabase setup.')
      setLoading(false)
    }
  }

  const openSavedRoadmap = () => {
    router.push('/dashboard')
  }

  const YesNo = ({
    label,
    field,
  }: {
    label: string
    field: keyof UserProfile
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">{label}</label>
      <div className="flex gap-3">
        {['Yes', 'No'].map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => update(field, opt === 'Yes')}
            className={`flex-1 border rounded-xl py-2.5 text-sm font-medium transition-all ${
              profile[field] === (opt === 'Yes')
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Landed</h1>
        </div>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          Your personal roadmap for getting set up in the United States. Sign in first, then answer only the questions that match your situation.
        </p>

        {isReturningToEdit && !authChecked ? (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 dark:bg-sky-950/40 p-4 text-sm text-blue-700 dark:text-sky-300">
            Opening your saved profile...
          </div>
        ) : null}

        <div className="mb-6 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100">
            <Mail className="h-4 w-4" />
            Email sign-in
          </div>

          {session ? (
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-700 dark:text-slate-200 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                Signed in as <span className="font-medium">{session.user.email}</span>. Your profile choices and roadmap can now be saved.
              </div>
            </div>
          ) : isSupabaseConfigured() && !authChecked ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Restoring your session...
            </p>
          ) : isSupabaseConfigured() ? (
            <>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white dark:bg-slate-900"
              />

              {codeSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    6-digit code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter the code from your email"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm tracking-[0.3em] focus:outline-none focus:border-gray-400 transition-colors bg-white dark:bg-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={authLoading}
                  className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  Send code
                </button>
                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={authLoading || !codeSent || otpCode.length !== 6}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:border-gray-400 hover:bg-white dark:bg-slate-900 transition-all disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Verify code
                  </span>
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                We&apos;ll email you a 6-digit code. Enter it here to unlock your saved profile form.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Add your Supabase URL and publishable key to enable email sign-in.
            </p>
          )}

          {authMessage && (
            <p className="text-xs rounded-xl bg-blue-50 dark:bg-sky-950/40 text-blue-700 dark:text-sky-300 px-3 py-2">{authMessage}</p>
          )}

          {session && hasSavedRoadmap && !isEditingSavedProfile && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openSavedRoadmap}
                className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:text-slate-100 transition-colors"
              >
                Open saved roadmap
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('landed_edit_profile', 'true')
                  setIsEditingSavedProfile(true)
                  setAuthMessage('Editing your saved profile now.')
                }}
                className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:text-slate-100 transition-colors"
              >
                Edit saved profile
              </button>
            </div>
          )}
        </div>

        {session ? (
          isEditingSavedProfile || !hasSavedRoadmap ? (
            <div className="space-y-5">
              {isEditingSavedProfile && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 dark:bg-sky-950/40 px-4 py-3 text-sm text-blue-700 dark:text-sky-300">
                  You are editing your saved profile. Update any answers below, then rebuild your roadmap to save the changes.
                </div>
              )}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Current scope</p>
              <p className="text-sm text-gray-700 dark:text-slate-200">Landed is currently configured for people getting set up in the United States.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Visa type
              </label>
              <select
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white dark:bg-slate-900 transition-colors"
                onChange={e => update('visa_type', e.target.value)}
                value={profile.visa_type || ''}
              >
                <option value="" disabled>Select your visa type</option>
                {VISA_TYPES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <YesNo label="Are you currently in the United States?" field="currently_in_us" />

            {profile.visa_type === 'F-1' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    I-20 issue date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                    onChange={e => update('i20_issue_date', e.target.value)}
                    value={profile.i20_issue_date || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    Expected graduation date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                    onChange={e => update('graduation_date', e.target.value)}
                    value={profile.graduation_date || ''}
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                    We use this to time Post-OPT reminders and deadlines.
                  </p>
                </div>
              </>
            )}

            {profile.currently_in_us !== undefined && (
              <>
                <YesNo label={`Were you in the U.S. at any time during ${LAST_TAX_YEAR}?`} field="was_in_us_last_tax_year" />
                {profile.was_in_us_last_tax_year && (
                  <YesNo label={`Did you have any U.S. income during ${LAST_TAX_YEAR}?`} field="had_us_income_last_tax_year" />
                )}
              </>
            )}

            {profile.currently_in_us ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    Current employment status
                  </label>
                  <select
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white dark:bg-slate-900 transition-colors"
                    onChange={e => update('employment_status', e.target.value)}
                    value={profile.employment_status || 'none'}
                  >
                    {EMPLOYMENT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <YesNo label="Do you have a U.S. mobile number?" field="has_mobile_number" />

                {profile.has_mobile_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                      U.S. phone number
                    </label>
                    <input
                      type="tel"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white dark:bg-slate-900"
                      onChange={e => update('us_phone_number', e.target.value)}
                      value={profile.us_phone_number || ''}
                      placeholder="(480) 555-0123"
                    />
                  </div>
                )}
                <YesNo label="Do you have a U.S. bank account?" field="has_bank_account" />
                <YesNo label="Do you have an SSN?" field="has_ssn" />
                <YesNo label="Do you have an ITIN?" field="has_itin" />
                <YesNo label="Do you have a U.S. address?" field="has_address" />
              </>
            ) : profile.currently_in_us === false ? (
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                U.S.-specific setup questions like bank account, SSN, ITIN, address, and current employment will appear after the user is already in the U.S. For now, we&apos;ll use your origin country, visa type, and arrival status to build the roadmap.
              </div>
            ) : null}

            {error && (
              <p className="text-red-500 dark:text-red-300 text-sm bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !profile.visa_type || !profile.country_of_origin || profile.currently_in_us === undefined}
              className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building your roadmap...
                </span>
              ) : (
                'Save profile and build roadmap →'
              )}
            </button>
          </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-5 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              Redirecting to your dashboard...
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-5 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            Sign in with your email code first. Once you are signed in, the form will adapt based on your answers and save the relevant profile details to your account.
          </div>
        )}
      </div>
    </main>
  )
}
