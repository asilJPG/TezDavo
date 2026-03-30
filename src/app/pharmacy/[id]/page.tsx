'use client'
// src/app/pharmacy/[id]/page.tsx — Публичный профиль аптеки

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'

interface PharmacyInventory {
  id: string
  price: number
  quantity: number
  in_stock: boolean
  medicine: {
    id: string
    name: string
    generic_name?: string
    category: string
    dosage_strength?: string
    requires_prescription: boolean
  }
}

interface PharmacyDetail {
  id: string
  name: string
  description?: string
  address: string
  lat: number
  lng: number
  phone: string
  working_hours: { mon_fri: string; sat_sun: string }
  logo_url?: string
  is_verified: boolean
  rating: number
  review_count: number
}

export default function PharmacyPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem, count, pharmacyId } = useCart()
  const [pharmacy, setPharmacy] = useState<PharmacyDetail | null>(null)
  const [inventory, setInventory] = useState<PharmacyInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addedId, setAddedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPharmacy = async () => {
      const res = await fetch(`/api/pharmacies/${params.id}`)
      const data = await res.json()
      setPharmacy(data.pharmacy)
      setInventory(data.inventory || [])
      setLoading(false)
    }
    fetchPharmacy()
  }, [params.id])

  const handleAddToCart = (item: PharmacyInventory) => {
    if (pharmacyId && pharmacyId !== params.id) {
      if (!confirm('В корзине есть товары из другой аптеки. Очистить корзину?')) return
    }
    addItem({
      inventory_id: item.id,
      medicine_id: item.medicine.id,
      pharmacy_id: params.id as string,
      pharmacy_name: pharmacy?.name || '',
      medicine_name: item.medicine.name,
      price: item.price,
    })
    setAddedId(item.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  const filtered = inventory.filter(i =>
    i.medicine.name.toLowerCase().includes(search.toLowerCase())
  )

  const categories = [...new Set(inventory.map(i => i.medicine.category))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Аптека не найдена</p>
          <button onClick={() => router.back()} className="text-blue-600 mt-2 block mx-auto">← Назад</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <span className="font-semibold text-gray-900 flex-1 truncate">{pharmacy.name}</span>
        {count > 0 && (
          <Link href="/cart" className="relative text-2xl">
            🛒
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {count}
            </span>
          </Link>
        )}
      </header>

      {/* Pharmacy info card */}
      <div className="bg-white px-4 py-5 mb-2">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
            🏪
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-gray-900 text-lg">{pharmacy.name}</h1>
              {pharmacy.is_verified && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">✓ Верифицировано</span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">📍 {pharmacy.address}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-amber-500 text-sm">⭐ {pharmacy.rating.toFixed(1)}</span>
              <span className="text-gray-400 text-xs">({pharmacy.review_count} отзывов)</span>
            </div>
          </div>
        </div>

        {/* Working hours & phone */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">Пн–Пт</p>
            <p className="font-medium text-gray-900 text-sm">{pharmacy.working_hours.mon_fri}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">Сб–Вс</p>
            <p className="font-medium text-gray-900 text-sm">{pharmacy.working_hours.sat_sun}</p>
          </div>
        </div>

        <a
          href={`tel:${pharmacy.phone}`}
          className="flex items-center gap-2 mt-3 text-blue-600 text-sm font-medium"
        >
          📞 {pharmacy.phone}
        </a>
      </div>

      {/* Inventory search */}
      <div className="px-4 py-3 bg-white border-b sticky top-14 z-10">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по аптеке..."
          className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none"
        />
      </div>

      {/* Category chips */}
      {!search && (
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              className="flex-shrink-0 bg-white text-gray-600 text-xs px-3 py-1.5 rounded-full border border-gray-200 font-medium"
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Medicine list */}
      <div className="px-4 space-y-2 mt-2">
        <p className="text-xs text-gray-500">{filtered.length} позиций в наличии</p>

        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💊</span>
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/medicine/${item.medicine.id}`}>
                <p className="font-medium text-gray-900 text-sm truncate">{item.medicine.name}</p>
              </Link>
              {item.medicine.generic_name && (
                <p className="text-xs text-gray-400 truncate">{item.medicine.generic_name}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-blue-600 text-sm">{formatPrice(item.price)}</span>
                <span className="text-xs text-gray-400">{item.quantity} шт.</span>
                {item.medicine.requires_prescription && (
                  <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">Рецепт</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleAddToCart(item)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                addedId === item.id
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {addedId === item.id ? '✓' : '+'}
            </button>
          </div>
        ))}

        {filtered.length === 0 && search && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">Ничего не найдено по запросу «{search}»</p>
          </div>
        )}
      </div>
    </div>
  )
}
