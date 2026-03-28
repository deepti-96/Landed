import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { StepWithStatus, UserProfile } from '@/lib/types'

const PROFILE_KEY = 'landed_profile'
const PLAN_KEY = 'landed_plan'

export interface SavedRoadmap {
  profile: UserProfile
  plan: StepWithStatus[]
}

export function saveRoadmapToLocalStorage(profile: Partial<UserProfile>, plan: StepWithStatus[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
}

export function loadRoadmapFromLocalStorage(): SavedRoadmap | null {
  if (typeof window === 'undefined') return null

  const storedProfile = localStorage.getItem(PROFILE_KEY)
  const storedPlan = localStorage.getItem(PLAN_KEY)

  if (!storedProfile || !storedPlan) return null

  try {
    return {
      profile: JSON.parse(storedProfile) as UserProfile,
      plan: JSON.parse(storedPlan) as StepWithStatus[],
    }
  } catch {
    return null
  }
}

export async function saveRoadmapToSupabase(
  supabase: SupabaseClient,
  session: Session,
  profile: Partial<UserProfile>,
  plan: StepWithStatus[]
) {
  const payload = {
    user_id: session.user.id,
    email: session.user.email ?? null,
    profile,
    plan,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('user_profiles')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) throw error
}

export async function loadRoadmapFromSupabase(
  supabase: SupabaseClient,
  session: Session
): Promise<SavedRoadmap | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('profile, plan')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (error) throw error
  if (!data?.profile || !data?.plan) return null

  return {
    profile: data.profile as UserProfile,
    plan: data.plan as StepWithStatus[],
  }
}
