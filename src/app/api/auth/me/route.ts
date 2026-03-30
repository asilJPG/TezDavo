import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ user: null })

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  return NextResponse.json({ user: data })
}
