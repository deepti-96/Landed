import { VisaStep, UserProfile, DeadlineInfo, UrgencyLevel } from './types'

export function calculateDeadline(
  step: VisaStep,
  profile: UserProfile
): DeadlineInfo | null {
  if (!step.deadline_days || !step.deadline_trigger) return null

  const triggerValue = profile[step.deadline_trigger as keyof UserProfile]
  if (!triggerValue || typeof triggerValue !== 'string') return null

  const trigger = new Date(triggerValue)
  if (isNaN(trigger.getTime())) return null

  const deadline = new Date(trigger)
  deadline.setDate(deadline.getDate() + step.deadline_days)

  const today = new Date()
  const daysRemaining = Math.ceil(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  const urgency: UrgencyLevel =
    daysRemaining <= 14 ? 'red' :
    daysRemaining <= 30 ? 'amber' : 'green'

  return { date: deadline, daysRemaining, urgency }
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}
