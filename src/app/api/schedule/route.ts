// src/app/api/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET — list user's medication schedules
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: dbUser } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const active = searchParams.get('active')

  let query = supabase
    .from('medication_schedule')
    .select('*')
    .eq('user_id', dbUser.id)
    .order('created_at', { ascending: false })

  if (active === 'true') query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ schedules: data })
}

// POST — add new medication to schedule
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: dbUser } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const { medicine_name, dosage, times_per_day, schedule_times, start_date, end_date, notes } = body

  if (!medicine_name || !dosage || !times_per_day || !start_date) {
    return NextResponse.json({ error: 'Не все поля заполнены' }, { status: 400 })
  }

  if (schedule_times.length !== times_per_day) {
    return NextResponse.json({ error: 'Количество времён приёма должно совпадать с times_per_day' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('medication_schedule')
    .insert({
      user_id: dbUser.id,
      medicine_name,
      dosage,
      times_per_day,
      schedule_times,
      start_date,
      end_date: end_date || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ schedule: data }, { status: 201 })
}
