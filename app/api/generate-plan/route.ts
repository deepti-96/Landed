import { NextRequest, NextResponse } from 'next/server'
import f1Steps from '@/data/f1-steps.json'
import { StepWithStatus, UserProfile, VisaStep } from '@/lib/types'

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
  if (profile.has_itin) completed.add('itin')
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

function buildPlan(profile: UserProfile) {
  const steps = f1Steps as VisaStep[]
  const stepMap = new Map(steps.map(step => [step.id, step]))
  const completed = getCompletedSteps(profile)

  return steps.map((step): StepWithStatus => {
    if (completed.has(step.id)) {
      return {
        ...step,
        status: 'done',
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
