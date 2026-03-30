// src/app/api/schedule/[id]/log/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// POST — отметить приём дозы (принял / пропустил)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: dbUser } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { status, scheduled_time, date } = await req.json()

  // Проверяем что расписание принадлежит пользователю
  const { data: schedule } = await supabase
    .from('medication_schedule')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', dbUser.id)
    .single()

  if (!schedule) return NextResponse.json({ error: 'Расписание не найдено' }, { status: 404 })

  // Upsert лог
  const { data, error } = await supabase
    .from('schedule_log')
    .upsert({
      schedule_id: params.id,
      user_id: dbUser.id,
      scheduled_time,
      date,
      status,
      taken_at: status === 'taken' ? new Date().toISOString() : null,
    }, {
      onConflict: 'schedule_id,date,scheduled_time',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ log: data })
}

// GET — получить логи для расписания за конкретную дату
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('schedule_log')
    .select('*')
    .eq('schedule_id', params.id)
    .eq('date', date)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ logs: data || [] })
}
