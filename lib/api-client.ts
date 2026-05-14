export async function getErrorMessageFromResponse(res: Response, fallback: string) {
  const contentType = res.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json')) {
      const data = await res.json()
      if (data && typeof data.error === 'string' && data.error.trim()) {
        return data.error
      }
    } else {
      const text = await res.text()
      if (text.trim()) return text
    }
  } catch {
    return fallback
  }

  return fallback
}
