// src/app/api/medicines/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  // Get medicine details
  const { data: medicine, error } = await supabase
    .from('medicines')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !medicine) {
    return NextResponse.json({ error: 'Лекарство не найдено' }, { status: 404 })
  }

  // Get pharmacy prices (sorted by price asc)
  const { data: inventory } = await supabase
    .from('pharmacy_inventory')
    .select(`
      id,
      price,
      quantity,
      in_stock,
      pharmacy:pharmacies(id, name, address, lat, lng, phone, rating, is_verified, working_hours)
    `)
    .eq('medicine_id', params.id)
    .eq('in_stock', true)
    .order('price', { ascending: true })

  return NextResponse.json({
    medicine,
    prices: inventory || [],
  })
}
