import type { UserProfile } from '@/lib/types'
import { isSupportedVisaType } from '@/lib/visa'

const EMPLOYMENT_STATUSES = new Set([
  'unemployed',
  'on_campus',
  'cpt',
  'opt',
  'stem_opt',
  'none',
])

function isBoolean(value: unknown) {
  return typeof value === 'boolean'
}

function isOptionalBoolean(value: unknown) {
  return value === undefined || isBoolean(value)
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string'
}

export function validateRoadmapProfile(input: unknown) {
  if (!input || typeof input !== 'object') {
    return 'Profile payload is missing or invalid.'
  }

  const profile = input as Partial<UserProfile>

  if (typeof profile.country_of_origin !== 'string' || !profile.country_of_origin.trim()) {
    return 'Country of origin is required.'
  }

  if (typeof profile.visa_type !== 'string' || !profile.visa_type.trim()) {
    return 'Visa type is required.'
  }

  if (!isSupportedVisaType(profile.visa_type)) {
    return 'Landed currently supports roadmap generation for F-1 students only.'
  }

  if (!isBoolean(profile.currently_in_us)) {
    return 'Please indicate whether you are currently in the United States.'
  }

  if (
    !isOptionalBoolean(profile.was_in_us_last_tax_year) ||
    !isOptionalBoolean(profile.had_us_income_last_tax_year) ||
    !isOptionalBoolean(profile.has_ssn) ||
    !isOptionalBoolean(profile.has_bank_account) ||
    !isOptionalBoolean(profile.has_mobile_number) ||
    !isOptionalBoolean(profile.has_address) ||
    !isOptionalBoolean(profile.has_itin)
  ) {
    return 'One or more profile answers have an invalid format.'
  }

  if (!isOptionalString(profile.i20_issue_date) || !isOptionalString(profile.graduation_date) || !isOptionalString(profile.us_phone_number)) {
    return 'One or more profile fields have an invalid format.'
  }

  if (profile.employment_status && !EMPLOYMENT_STATUSES.has(profile.employment_status)) {
    return 'Employment status is invalid.'
  }

  return null
}
