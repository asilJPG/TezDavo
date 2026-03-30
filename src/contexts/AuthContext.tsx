'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'

interface AuthContextType {
  supabaseUser: SupabaseUser | null
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  supabaseUser: null,
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadUser(sbUser: SupabaseUser | null) {
      setSupabaseUser(sbUser)
      if (!sbUser) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', sbUser.id)
          .single()
        setUser(data ?? null)
      } catch {
        setUser(null)
      }
      setLoading(false)
    }

    // getSession более надёжен чем getUser для начальной загрузки
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ supabaseUser, user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/login'
}
