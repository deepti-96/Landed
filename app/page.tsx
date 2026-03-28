'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { UserProfile } from '@/lib/types'
import { getCurrentSession, getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase'
import { loadRoadmapFromSupabase, saveRoadmapToLocalStorage, saveRoadmapToSupabase } from '@/lib/roadmap-storage'
import { CheckCircle2, KeyRound, Mail, Plane } from 'lucide-react'

const VISA_TYPES = ['F-1', 'J-1', 'H-1B', 'O-1', 'L-1', 'Other']
const COUNTRIES = [
  'Afghanistan',
  'Argentina',
  'Australia',
  'Bangladesh',
  'Brazil',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Egypt',
  'France',
  'Germany',
  'Ghana',
  'India',
  'Indonesia',
  'Iran',
  'Italy',
  'Japan',
  'Kenya',
  'Mexico',
  'Nepal',
  'Nigeria',
  'Pakistan',
  'Peru',
  'Philippines',
  'Saudi Arabia',
  'South Africa',
  'South Korea',
  'Spain',
  'Sri Lanka',
  'Taiwan',
  'Thailand',
  'Turkey',
  'United Arab Emirates',
  'United Kingdom',
  'Vietnam',
  'Other',
]
const EMPLOYMENT_OPTIONS = [
  { value: 'none', label: 'Not working yet' },
  { value: 'on_campus', label: 'On-campus job' },
  { value: 'cpt', label: 'CPT (internship)' },
  { value: 'opt', label: 'OPT' },
  { value: 'stem_opt', label: 'STEM OPT' },
]

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
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    has_ssn: false,
    has_bank_account: false,
    has_address: false,
    has_itin: false,
    employment_status: 'none',
  })

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    let isMounted = true

    getCurrentSession()
      .then(currentSession => {
        if (isMounted && currentSession) {
          setSession(currentSession)
          setEmail(currentSession.user.email ?? '')
        }
      })
      .catch(() => {
        if (isMounted) setAuthMessage('Could not restore your session.')
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) return

      setEmail(nextSession.user.email ?? '')
      setCodeSent(false)
      setOtpCode('')
      const savedRoadmap = await loadRoadmapFromSupabase(supabase, nextSession).catch(() => null)
      if (savedRoadmap) {
        setProfile(savedRoadmap.profile)
        setAuthMessage('Signed in. Your saved profile is ready to review.')
      } else {
        setAuthMessage('Signed in. Fill out your profile to save your roadmap.')
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

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

    if (!profile.visa_type || !profile.country_of_origin) {
      setError('Please fill in your visa type and country.')
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

      const supabase = getSupabaseBrowserClient()
      if (supabase) {
        await saveRoadmapToSupabase(supabase, session, profile, plan)
      }

      router.push('/dashboard')
    } catch (_e) {
      setError('Something went wrong. Check your API key and Supabase setup.')
      setLoading(false)
    }
  }

  const openSavedRoadmap = () => {
    router.push('/dashboard')
  }

  const YesNo = ({ label, field }: { label: string; field: keyof UserProfile }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-3">
        {['Yes', 'No'].map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => update(field, opt === 'Yes')}
            className={`flex-1 border rounded-xl py-2.5 text-sm font-medium transition-all ${
              profile[field] === (opt === 'Yes')
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Landed</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Your personal roadmap through US immigration bureaucracy. Sign in with email first, then save your profile and roadmap.
        </p>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <Mail className="h-4 w-4" />
            Email sign-in
          </div>

          {session ? (
            <div className="rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-700 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                Signed in as <span className="font-medium">{session.user.email}</span>. Your profile choices and roadmap can now be saved.
              </div>
            </div>
          ) : isSupabaseConfigured() ? (
            <>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
              />

              {codeSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    6-digit code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter the code from your email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm tracking-[0.3em] focus:outline-none focus:border-gray-400 transition-colors bg-white"
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
                  className="w-full border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-white transition-all disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Verify code
                  </span>
                </button>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                We&apos;ll email you a 6-digit code. Enter it here to unlock your saved profile form.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 leading-relaxed">
              Add your Supabase URL and publishable key to enable email sign-in.
            </p>
          )}

          {authMessage && (
            <p className="text-xs rounded-xl bg-blue-50 text-blue-700 px-3 py-2">{authMessage}</p>
          )}

          {session && (
            <button
              type="button"
              onClick={openSavedRoadmap}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Open saved roadmap
            </button>
          )}
        </div>

        {session ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country of origin
              </label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                onChange={e => update('country_of_origin', e.target.value)}
                value={profile.country_of_origin || ''}
              >
                <option value="" disabled>Select your country</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visa type
              </label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white transition-colors"
                onChange={e => update('visa_type', e.target.value)}
                value={profile.visa_type || ''}
              >
                <option value="" disabled>Select your visa type</option>
                {VISA_TYPES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {profile.visa_type === 'F-1' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I-20 issue date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  onChange={e => update('i20_issue_date', e.target.value)}
                  value={profile.i20_issue_date || ''}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current employment status
              </label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white transition-colors"
                onChange={e => update('employment_status', e.target.value)}
                value={profile.employment_status || 'none'}
              >
                {EMPLOYMENT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <YesNo label="Do you have a US bank account?" field="has_bank_account" />
            <YesNo label="Do you have an SSN?" field="has_ssn" />
            <YesNo label="Do you have an ITIN?" field="has_itin" />
            <YesNo label="Do you have a US address?" field="has_address" />

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !profile.visa_type || !profile.country_of_origin}
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
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-5 text-sm text-gray-500 leading-relaxed">
            Sign in with your email code first. Once you are signed in, your profile dropdown selections will appear here and can be saved to your account.
          </div>
        )}
      </div>
    </main>
  )
}
