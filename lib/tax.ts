import { TaxGuidance, UserProfile } from '@/lib/types'

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getTaxGuidance(
  profile: UserProfile,
  today = new Date()
): TaxGuidance | null {
  if (!profile.was_in_us_last_tax_year) return null

  const currentDay = getStartOfDay(today)
  const filingYear = currentDay.getFullYear()
  const taxYear = filingYear - 1
  const hadIncome = Boolean(profile.had_us_income_last_tax_year)
  const deadlineDate = hadIncome
    ? new Date(filingYear, 3, 15)
    : new Date(filingYear, 5, 15)
  const normalizedDeadline = getStartOfDay(deadlineDate)
  const daysUntilDeadline = Math.ceil(
    (normalizedDeadline.getTime() - currentDay.getTime()) / (1000 * 60 * 60 * 24)
  )

  const status =
    daysUntilDeadline < 0 ? 'overdue' :
    daysUntilDeadline <= 30 ? 'due_now' : 'upcoming'
  const deadline = formatDate(deadlineDate)

  if (hadIncome) {
    return {
      taxYear,
      deadline,
      status,
      forms: ['Form 1040-NR', 'Form 8843'],
      summary: `Because you said you were in the U.S. during ${taxYear} and had U.S. income, you likely need to file Form 1040-NR and Form 8843.`,
      details: [
        `Federal deadline: ${deadline}.`,
        'If you had wages, this is the main federal filing deadline for most nonresident students.',
        'You may also need a state return depending on where you lived or worked.',
      ],
      officialLinks: [
        { label: 'IRS Form 1040-NR', url: 'https://www.irs.gov/forms-pubs/about-form-1040-nr' },
        { label: 'IRS Form 8843', url: 'https://www.irs.gov/forms-pubs/about-form-8843' },
      ],
    }
  }

  return {
    taxYear,
    deadline,
    status,
    forms: ['Form 8843'],
    summary: `Because you said you were in the U.S. during ${taxYear} and did not have U.S. income, you likely still need to file Form 8843.`,
    details: [
      `Federal deadline: ${deadline}.`,
      'This usually applies to F-1 students who were present in the U.S. but did not earn U.S. income during the tax year.',
      'If you actually had any taxable U.S. income, update your profile so the app can suggest the right return.',
    ],
    officialLinks: [
      { label: 'IRS Form 8843', url: 'https://www.irs.gov/forms-pubs/about-form-8843' },
      { label: 'IRS exempt individual rules for students', url: 'https://www.irs.gov/individuals/international-taxpayers/exempt-individual-who-is-a-student' },
    ],
  }
}
