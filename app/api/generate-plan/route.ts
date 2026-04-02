import { NextRequest, NextResponse } from 'next/server'
import f1Steps from '@/data/f1-steps.json'
import { StepWithStatus, UserProfile, VisaStep } from '@/lib/types'

function getDaysUntil(dateString?: string) {
  if (!dateString) return null

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return Math.ceil(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  )
}

function getCompletedSteps(profile: UserProfile) {
  const completed = new Set<string>()

  if (profile.currently_in_us) {
    completed.add('i20')
    completed.add('sevis_fee')
    completed.add('visa_stamp')
    completed.add('arrive_us')
    completed.add('university_checkin')
  }

  if (profile.has_address) completed.add('local_address')
  if (profile.has_mobile_number) completed.add('mobile_number')
  if (profile.has_itin || profile.has_ssn) completed.add('itin')
  if (profile.has_ssn) completed.add('ssn_on_campus')
  if (profile.has_bank_account) completed.add('bank_account')

  if (profile.employment_status === 'cpt') {
    completed.add('cpt_authorization')
  }

  if (profile.employment_status === 'opt') {
    completed.add('opt_application')
  }

  if (profile.employment_status === 'stem_opt') {
    completed.add('opt_application')
    completed.add('stem_opt')
  }

  return completed
}

function getBlockingReason(step: VisaStep, missingIds: string[], stepMap: Map<string, VisaStep>) {
  const missingTitles = missingIds.map(id => stepMap.get(id)?.title || id)

  if (missingTitles.length === 1) {
    return `Complete "${missingTitles[0]}" first.`
  }

  return `Complete these first: ${missingTitles.join(', ')}.`
}

function getStepOverride(step: VisaStep, profile: UserProfile, completed: Set<string>) {
  if (step.id === 'itin' && profile.has_ssn) {
    return {
      status: 'done' as const,
      blocking_reason: undefined,
    }
  }

  if (step.id === 'opt_application') {
    const daysUntilGraduation = getDaysUntil(profile.graduation_date)

    if (daysUntilGraduation === null) {
      return {
        status: 'blocked' as const,
        blocking_reason: 'Add your expected graduation date first so the OPT filing window can be calculated.',
      }
    }

    if (daysUntilGraduation > 90) {
      return {
        status: 'blocked' as const,
        blocking_reason: `You can file for Post-OPT starting 90 days before graduation. Your window opens in ${daysUntilGraduation - 90} days.`,
      }
    }
  }

  if (step.id === 'stem_opt' && !completed.has('opt_application')) {
    return {
      status: 'blocked' as const,
      blocking_reason: 'STEM OPT comes after regular OPT. Finish your Post-OPT process first.',
    }
  }

  return null
}

function buildPlan(profile: UserProfile) {
  const steps = (f1Steps as VisaStep[]).filter(step => !(profile.has_ssn && step.id === 'itin'))
  const stepMap = new Map(steps.map(step => [step.id, step]))
  const completed = getCompletedSteps(profile)

  return steps.map((step): StepWithStatus => {
    if (completed.has(step.id)) {
      return {
        ...step,
        status: 'done',
      }
    }

    const override = getStepOverride(step, profile, completed)
    if (override) {
      return {
        ...step,
        ...override,
      }
    }

    const missingRequirements = step.requires.filter(requirement => !completed.has(requirement))

    if (missingRequirements.length === 0) {
      return {
        ...step,
        status: 'available',
      }
    }

    return {
      ...step,
      status: 'blocked',
      blocking_reason: getBlockingReason(step, missingRequirements, stepMap),
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const profile = (await req.json()) as UserProfile
    const plan = buildPlan(profile)
    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Generate plan error:', error)
    return NextResponse.json(
      { error: 'Failed to generate plan.' },
      { status: 500 }
    )
  }
}
