'use client'
import { useEffect, useState } from 'react'
import type { UserProfile } from '@/lib/types'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  profile: UserProfile | null
  loading: boolean
  error: string
  onClose: () => void
  onSave: (profile: UserProfile) => void
}

const VISA_TYPES = ['F-1', 'J-1', 'H-1B', 'O-1', 'L-1', 'Other']
const EMPLOYMENT_OPTIONS = [
  { value: 'none', label: 'Not working yet' },
  { value: 'on_campus', label: 'On-campus job' },
  { value: 'cpt', label: 'CPT (internship)' },
  { value: 'opt', label: 'OPT' },
  { value: 'stem_opt', label: 'STEM OPT' },
] as const
const LAST_TAX_YEAR = new Date().getFullYear() - 1

export default function ProfileEditorDialog({ open, profile, loading, error, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<UserProfile | null>(profile)

  useEffect(() => {
    setDraft(profile)
  }, [profile, open])

  if (!open || !draft) return null

  const update = (key: keyof UserProfile, value: string | boolean) => {
    setDraft(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  const yesNo = (label: string, field: keyof UserProfile) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      <div className="flex gap-3">
        {['Yes', 'No'].map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => update(field, opt === 'Yes')}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
              draft[field] === (opt === 'Yes')
                ? 'border-sky-200 bg-sky-100 text-sky-900 shadow-sm dark:border-sky-300/30 dark:bg-sky-200/20 dark:text-sky-50'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )

  const disabled = !draft.visa_type || draft.currently_in_us === undefined

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Edit profile</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Update your saved details</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Save changes here and your roadmap will rebuild using the latest answers.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[calc(92vh-96px)] overflow-y-auto px-6 py-6 pb-28">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Current scope</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">Landed is currently configured for people getting set up in the United States.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Visa type</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={draft.visa_type || ''}
                  onChange={e => update('visa_type', e.target.value)}
                >
                  <option value="" disabled>Select your visa type</option>
                  {VISA_TYPES.map(visa => (
                    <option key={visa} value={visa}>{visa}</option>
                  ))}
                </select>
              </div>

              {yesNo('Are you currently in the United States?', 'currently_in_us')}

              {draft.visa_type === 'F-1' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">I-20 issue date</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      value={draft.i20_issue_date || ''}
                      onChange={e => update('i20_issue_date', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Expected graduation date</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      value={draft.graduation_date || ''}
                      onChange={e => update('graduation_date', e.target.value)}
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">We use this to time Post-OPT reminders and deadlines.</p>
                  </div>
                </>
              )}

              {draft.currently_in_us !== undefined && (
                <>
                  {yesNo(`Were you in the U.S. at any time during ${LAST_TAX_YEAR}?`, 'was_in_us_last_tax_year')}
                  {draft.was_in_us_last_tax_year && yesNo(`Did you have any U.S. income during ${LAST_TAX_YEAR}?`, 'had_us_income_last_tax_year')}
                </>
              )}

              {draft.currently_in_us ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Current employment status</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      value={draft.employment_status || 'none'}
                      onChange={e => update('employment_status', e.target.value)}
                    >
                      {EMPLOYMENT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {yesNo('Do you have a U.S. mobile number?', 'has_mobile_number')}

                  {draft.has_mobile_number && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">U.S. phone number</label>
                      <input
                        type="tel"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        value={draft.us_phone_number || ''}
                        onChange={e => update('us_phone_number', e.target.value)}
                        placeholder="(480) 555-0123"
                      />
                    </div>
                  )}
                  {yesNo('Do you have a U.S. bank account?', 'has_bank_account')}
                  {yesNo('Do you have an SSN?', 'has_ssn')}
                  {yesNo('Do you have an ITIN?', 'has_itin')}
                  {yesNo('Do you have a U.S. address?', 'has_address')}
                </>
              ) : draft.currently_in_us === false ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  U.S.-specific setup questions like bank account, SSN, ITIN, address, and current employment appear after the user is already in the U.S.
                </div>
              ) : null}

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</p>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <p className="text-sm text-slate-500 dark:text-slate-400">Use <span className="font-medium text-slate-700 dark:text-slate-200">Save changes</span> to update your profile and rebuild the roadmap.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
              >
                Cancel
              </button>
              <button
              type="button"
              onClick={() => onSave(draft)}
              disabled={loading || disabled}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {loading ? 'Saving profile...' : 'Save changes'}
            </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
