// src/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'

interface AuthState {
  supabaseUser: SupabaseUser | null
  user: User | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    supabaseUser: null,
    user: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createClient()

    const fetchUser = async (supabaseUser: SupabaseUser | null) => {
      if (!supabaseUser) {
        setState({ supabaseUser: null, user: null, loading: false })
        return
      }

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', supabaseUser.id)
        .single()

      setState({ supabaseUser, user, loading: false })
    }

    supabase.auth.getUser().then(({ data }) => fetchUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => fetchUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [])

  return state
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/login'
}
