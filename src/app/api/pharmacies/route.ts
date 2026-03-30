import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  const { data, error } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('is_active', true)
    .eq('is_verified', true)
    .order('rating', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let pharmacies = data || []
  if (lat && lng) {
    pharmacies = pharmacies
      .map(p => ({ ...p, distance: Math.sqrt((p.lat - lat) ** 2 + (p.lng - lng) ** 2) * 111 }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
  }

  return NextResponse.json({ pharmacies })
}
