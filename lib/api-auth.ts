import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 12

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are not configured.')
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getBearerToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice('Bearer '.length).trim() || null
}

export async function requireAuthenticatedUser(req: NextRequest) {
  const token = getBearerToken(req)
  if (!token) {
    return { error: 'Unauthorized', status: 401 as const }
  }

  const supabase = getSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { error: 'Unauthorized', status: 401 as const }
  }

  return { user }
}

export function enforceRateLimit(key: string) {
  const now = Date.now()
  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return null
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      error: 'Too many requests. Please wait a minute and try again.',
      status: 429 as const,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  return null
}
