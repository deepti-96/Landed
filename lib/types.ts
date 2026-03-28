export type StepStatus = 'done' | 'available' | 'blocked'

export type UrgencyLevel = 'red' | 'amber' | 'green'

export interface VisaStep {
  id: string
  title: string
  description: string
  requires: string[]
  unlocks: string[]
  deadline_days?: number | null
  deadline_trigger?: string
  official_link?: string
  forms?: string[]
  common_mistakes?: string[]
  documents_needed?: string[]
}

export interface UserProfile {
  country_of_origin: string
  visa_type: string
  degree_level?: string
  i20_issue_date?: string
  opt_start_date?: string
  graduation_date?: string
  has_ssn: boolean
  has_bank_account: boolean
  has_address: boolean
  has_itin: boolean
  employment_status: 'unemployed' | 'on_campus' | 'cpt' | 'opt' | 'stem_opt' | 'none'
}

export interface StepWithStatus extends VisaStep {
  status: StepStatus
  deadline_date?: string
  days_remaining?: number
  urgency?: UrgencyLevel
  blocking_reason?: string
}

export interface DeadlineInfo {
  date: Date
  daysRemaining: number
  urgency: UrgencyLevel
}
