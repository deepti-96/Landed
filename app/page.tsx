'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/lib/types'
import { Plane } from 'lucide-react'

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
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    has_ssn: false,
    has_bank_account: false,
    has_address: false,
    has_itin: false,
    employment_status: 'none',
  })

  const update = (key: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
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
      localStorage.setItem('landed_profile', JSON.stringify(profile))
      localStorage.setItem('landed_plan', JSON.stringify(plan))
      router.push('/dashboard')
    } catch (e) {
      setError('Something went wrong. Make sure your GROQ_API_KEY is set.')
      setLoading(false)
    }
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
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Your personal roadmap through US immigration bureaucracy. Tell us where you are — we'll show you every step ahead.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country of origin
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              onChange={e => update('country_of_origin', e.target.value)}
              defaultValue=""
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
              defaultValue=""
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
              defaultValue="none"
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
              'Build my roadmap →'
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
