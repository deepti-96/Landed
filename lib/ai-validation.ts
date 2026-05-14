import type { DraftMessageType, StepWithStatus, UserProfile } from '@/lib/types'

const DRAFT_MESSAGE_TYPES = new Set<DraftMessageType>([
  'dso_email',
  'landlord_email',
  'bank_inquiry',
])

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isString(value: unknown) {
  return typeof value === 'string'
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string'
}

function isValidStep(value: unknown): value is StepWithStatus {
  if (!isObject(value)) return false

  return (
    isString(value.id) &&
    isString(value.title) &&
    isString(value.description) &&
    Array.isArray(value.requires) &&
    Array.isArray(value.unlocks) &&
    ['done', 'available', 'blocked'].includes(String(value.status)) &&
    isOptionalString(value.official_link)
  )
}

function isValidProfile(value: unknown): value is UserProfile {
  if (!isObject(value)) return false

  return (
    isString(value.country_of_origin) &&
    isString(value.visa_type) &&
    typeof value.has_ssn === 'boolean' &&
    typeof value.has_bank_account === 'boolean' &&
    typeof value.has_mobile_number === 'boolean' &&
    typeof value.has_address === 'boolean' &&
    typeof value.has_itin === 'boolean' &&
    isString(value.employment_status)
  )
}

export function validateExplainStepPayload(payload: unknown): ValidationResult<{ step: StepWithStatus; profile: UserProfile }> {
  if (!isObject(payload)) {
    return { ok: false, error: 'Request body is missing or invalid.' }
  }

  if (!isValidStep(payload.step)) {
    return { ok: false, error: 'Step payload is invalid.' }
  }

  if (!isValidProfile(payload.profile)) {
    return { ok: false, error: 'Profile payload is invalid.' }
  }

  return { ok: true, data: { step: payload.step, profile: payload.profile } }
}

export function validateDraftMessagePayload(payload: unknown): ValidationResult<{ type: DraftMessageType; step: StepWithStatus; profile: UserProfile }> {
  if (!isObject(payload)) {
    return { ok: false, error: 'Request body is missing or invalid.' }
  }

  if (!isString(payload.type) || !DRAFT_MESSAGE_TYPES.has(payload.type as DraftMessageType)) {
    return { ok: false, error: 'Draft type is invalid.' }
  }

  if (!isValidStep(payload.step)) {
    return { ok: false, error: 'Step payload is invalid.' }
  }

  if (!isValidProfile(payload.profile)) {
    return { ok: false, error: 'Profile payload is invalid.' }
  }

  return {
    ok: true,
    data: {
      type: payload.type as DraftMessageType,
      step: payload.step,
      profile: payload.profile,
    },
  }
}

export function validateChatAssistantPayload(payload: unknown): ValidationResult<{
  message: string
  messages: Array<{ role: 'assistant' | 'user'; content: string }>
  profile: UserProfile
  plan: StepWithStatus[]
}> {
  if (!isObject(payload)) {
    return { ok: false, error: 'Request body is missing or invalid.' }
  }

  if (!isString(payload.message) || !payload.message.trim()) {
    return { ok: false, error: 'Message is required.' }
  }

  if (!isValidProfile(payload.profile)) {
    return { ok: false, error: 'Profile payload is invalid.' }
  }

  if (!Array.isArray(payload.plan) || !payload.plan.every(isValidStep)) {
    return { ok: false, error: 'Plan payload is invalid.' }
  }

  const messages = Array.isArray(payload.messages)
    ? payload.messages.filter(
        entry =>
          isObject(entry) &&
          (entry.role === 'assistant' || entry.role === 'user') &&
          isString(entry.content)
      ) as Array<{ role: 'assistant' | 'user'; content: string }>
    : []

  return {
    ok: true,
    data: {
      message: payload.message,
      messages,
      profile: payload.profile,
      plan: payload.plan,
    },
  }
}
