'use client'
// src/app/admin/pharmacies/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AdminPharmacy {
  id: string
  name: string
  address: string
  phone: string
  license_number: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  owner_name?: string
}

export default function AdminPharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<AdminPharmacy[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending')

  useEffect(() => { fetchPharmacies() }, [])

  const fetchPharmacies = async () => {
    // В реальном приложении: /api/admin/pharmacies
    setLoading(false)
  }

  const verify = async (id: string, verified: boolean) => {
    await fetch(`/api/admin/pharmacies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_verified: verified }),
    })
    fetchPharmacies()
  }

  const block = async (id: string) => {
    await fetch(`/api/admin/pharmacies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    fetchPharmacies()
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/admin" className="text-gray-600 text-xl">←</Link>
        <h1 className="font-semibold text-gray-900 flex-1">Аптеки</h1>
      </header>

      {/* Filter tabs */}
      <div className="px-4 py-3 flex gap-2">
        {[
          { value: 'pending',  label: 'На модерации' },
          { value: 'verified', label: 'Верифицированные' },
          { value: 'all',      label: 'Все' },
        ].map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value as typeof filter)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium ${
              filter === t.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {loading && <p className="text-center text-gray-400 py-10">Загрузка...</p>}

        {!loading && pharmacies.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-2">🏪</div>
            <p className="text-gray-500 text-sm">Нет аптек</p>
          </div>
        )}

        {pharmacies.map(pharmacy => (
          <div key={pharmacy.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{pharmacy.name}</p>
                <p className="text-xs text-gray-400">{pharmacy.address}</p>
                <p className="text-xs text-gray-400">Лицензия: {pharmacy.license_number}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                pharmacy.is_verified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {pharmacy.is_verified ? '✓ Верифицирована' : 'На модерации'}
              </span>
            </div>

            {!pharmacy.is_verified && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => verify(pharmacy.id, false)}
                  className="flex-1 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-medium"
                >
                  Отклонить
                </button>
                <button
                  onClick={() => verify(pharmacy.id, true)}
                  className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold"
                >
                  ✓ Верифицировать
                </button>
              </div>
            )}

            {pharmacy.is_verified && pharmacy.is_active && (
              <button
                onClick={() => block(pharmacy.id)}
                className="w-full mt-3 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-medium"
              >
                Заблокировать
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
