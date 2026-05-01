export const VISA_OPTIONS = [
  { value: 'F-1', label: 'F-1', supported: true },
  { value: 'J-1', label: 'J-1 (coming soon)', supported: false },
  { value: 'H-1B', label: 'H-1B (coming soon)', supported: false },
  { value: 'O-1', label: 'O-1 (coming soon)', supported: false },
  { value: 'L-1', label: 'L-1 (coming soon)', supported: false },
  { value: 'Other', label: 'Other (coming soon)', supported: false },
] as const

export const SUPPORTED_VISA_TYPES: string[] = VISA_OPTIONS
  .filter(option => option.supported)
  .map(option => option.value)

export function isSupportedVisaType(visaType?: string | null) {
  return Boolean(visaType && SUPPORTED_VISA_TYPES.includes(visaType))
}
