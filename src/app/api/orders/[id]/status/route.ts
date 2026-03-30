// src/app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { OrderStatus } from '@/types'

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['pharmacy_confirmed', 'cancelled'],
  pharmacy_confirmed: ['courier_assigned', 'cancelled'],
  courier_assigned: ['picked_up', 'cancelled'],
  picked_up: ['delivered'],
  delivered: [],
  cancelled: [],
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: dbUser } = await supabase
    .from('users').select('id, role').eq('auth_id', user.id).single()
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { status, reason } = await req.json()

  // Get current order
  const { data: order } = await supabase
    .from('orders').select('*').eq('id', params.id).single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Validate transition
  const allowed = VALID_TRANSITIONS[order.status as OrderStatus] || []
  if (!allowed.includes(status as OrderStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${status}` },
      { status: 400 }
    )
  }

  // Build update object
  const update: Record<string, unknown> = { status }

  if (status === 'pharmacy_confirmed') update.confirmed_at = new Date().toISOString()
  if (status === 'courier_assigned') {
    update.courier_id = dbUser.id
    update.assigned_at = new Date().toISOString()
  }
  if (status === 'picked_up') update.picked_up_at = new Date().toISOString()
  if (status === 'delivered') update.delivered_at = new Date().toISOString()
  if (status === 'cancelled') update.cancelled_reason = reason || 'Отменено'

  const { data, error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ order: data })
}
