'use client'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'

export default function AdminPharmaciesPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6"><Link href="/admin" className="text-gray-500 text-xl">←</Link><h1 className="font-bold text-gray-900 text-xl">Аптеки</h1></div>
        <div className="text-center py-16"><div className="text-4xl mb-2">🏪</div><p className="text-gray-500 text-sm">Требуется admin API для модерации аптек</p></div>
      </div>
    </AppLayout>
  )
}
