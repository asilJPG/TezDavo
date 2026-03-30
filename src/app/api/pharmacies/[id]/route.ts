import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: pharmacy, error } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !pharmacy) {
    return NextResponse.json({ error: 'Аптека не найдена' }, { status: 404 })
  }

  const { data: inventory } = await supabase
    .from('pharmacy_inventory')
    .select('*, medicine:medicines(*)')
    .eq('pharmacy_id', params.id)
    .eq('in_stock', true)
    .order('price')

  return NextResponse.json({ pharmacy, inventory: inventory || [] })
}
