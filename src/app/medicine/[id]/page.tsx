'use client'
// src/app/medicine/[id]/page.tsx — Страница лекарства + сравнение цен

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface PharmacyPrice {
  inventory_id: string
  price: number
  quantity: number
  in_stock: boolean
  pharmacy: {
    id: string
    name: string
    address: string
    phone: string
    rating: number
    is_verified: boolean
    working_hours: { mon_fri: string; sat_sun: string }
  }
}

interface Medicine {
  id: string
  name: string
  generic_name?: string
  category: string
  manufacturer?: string
  dosage_form?: string
  dosage_strength?: string
  description?: string
  instructions?: string
  side_effects?: string
  contraindications?: string
  requires_prescription: boolean
}

export default function MedicinePage() {
  const params = useParams()
  const router = useRouter()
  const [medicine, setMedicine] = useState<Medicine | null>(null)
  const [prices, setPrices] = useState<PharmacyPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'prices' | 'info'>('prices')
  const [addedToCart, setAddedToCart] = useState<string | null>(null)

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const res = await fetch(`/api/medicines/${params.id}`)
        const data = await res.json()
        setMedicine(data.medicine)
        setPrices(data.prices || [])
      } finally {
        setLoading(false)
      }
    }
    fetchMedicine()
  }, [params.id])

  const addToCart = (inventoryId: string, pharmacyId: string, pharmacyName: string, price: number) => {
    // In real app: use cart context/store
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find((i: { inventory_id: string }) => i.inventory_id === inventoryId)
    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({
        inventory_id: inventoryId,
        medicine_id: params.id,
        pharmacy_id: pharmacyId,
        pharmacy_name: pharmacyName,
        medicine_name: medicine?.name,
        price,
        quantity: 1,
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    setAddedToCart(inventoryId)
    setTimeout(() => setAddedToCart(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
        <div className="animate-pulse p-4 space-y-3">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!medicine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Лекарство не найдено</p>
          <Link href="/search" className="text-blue-600 mt-2 block">← Назад к поиску</Link>
        </div>
      </div>
    )
  }

  const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : null

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <span className="font-semibold text-gray-900 flex-1 truncate">{medicine.name}</span>
        <Link href="/cart" className="text-2xl relative">
          🛒
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">2</span>
        </Link>
      </header>

      {/* Medicine hero */}
      <div className="bg-white px-4 pt-5 pb-4">
        <div className="flex gap-4 items-start">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-4xl">💊</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-xl leading-tight">{medicine.name}</h1>
            {medicine.generic_name && (
              <p className="text-gray-500 text-sm">{medicine.generic_name}</p>
            )}
            <p className="text-gray-400 text-xs mt-0.5">{medicine.manufacturer}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                {medicine.category}
              </span>
              {medicine.dosage_strength && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {medicine.dosage_strength}
                </span>
              )}
              {medicine.requires_prescription && (
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                  🔒 Рецепт
                </span>
              )}
            </div>
          </div>
        </div>

        {minPrice && (
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-gray-500 text-sm">от</span>
            <span className="text-2xl font-bold text-blue-600">{minPrice.toLocaleString()}</span>
            <span className="text-gray-500 text-sm">сум</span>
            <span className="text-gray-400 text-xs ml-2">в {prices.length} аптеках</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={() => setActiveTab('prices')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'prices' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          Цены в аптеках ({prices.length})
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'info' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
          }`}
        >
          Инструкция
        </button>
      </div>

      <div className="px-4 space-y-3">
        {activeTab === 'prices' && (
          <>
            {prices.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <div className="text-4xl mb-2">🏪</div>
                <p className="text-gray-500 text-sm">Нет в наличии в аптеках</p>
              </div>
            ) : (
              prices.map((p, i) => (
                <div key={p.inventory_id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{p.pharmacy.name}</span>
                        {p.pharmacy.is_verified && <span className="text-blue-500 text-xs">✓ Верифицировано</span>}
                        {i === 0 && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                            Лучшая цена
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">📍 {p.pharmacy.address}</p>
                      <p className="text-xs text-gray-400">⏰ {p.pharmacy.working_hours.mon_fri}</p>
                      <p className="text-xs text-gray-400">В наличии: {p.quantity} шт.</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600 text-lg">{p.price.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">сум</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/pharmacy/${p.pharmacy.id}`}
                      className="flex-1 text-center py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
                    >
                      Аптека
                    </Link>
                    <button
                      onClick={() => addToCart(p.inventory_id, p.pharmacy.id, p.pharmacy.name, p.price)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        addedToCart === p.inventory_id
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {addedToCart === p.inventory_id ? '✓ Добавлено' : 'В корзину'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'info' && (
          <div className="space-y-4">
            {medicine.description && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Описание</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{medicine.description}</p>
              </div>
            )}
            {medicine.instructions && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Способ применения</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{medicine.instructions}</p>
              </div>
            )}
            {medicine.side_effects && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">⚠️ Побочные эффекты</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{medicine.side_effects}</p>
              </div>
            )}
            {medicine.contraindications && (
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-2 text-sm">🚫 Противопоказания</h3>
                <p className="text-red-700 text-sm leading-relaxed">{medicine.contraindications}</p>
              </div>
            )}
            {/* AI Chat shortcut */}
            <Link
              href={`/ai-chat?medicine=${encodeURIComponent(medicine.name)}`}
              className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4"
            >
              <span className="text-2xl">🤖</span>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Спросить AI помощника</div>
                <div className="text-xs text-gray-500">Как принимать {medicine.name}?</div>
              </div>
              <span className="text-blue-500 ml-auto">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
