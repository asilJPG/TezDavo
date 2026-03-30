'use client'
// src/app/cart/page.tsx — Корзина и оформление заказа

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CartItem, formatPrice } from '@/types'

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('cart')
    if (stored) setCartItems(JSON.parse(stored))
  }, [])

  const updateQuantity = (inventoryId: string, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(item =>
        item.inventory_id === inventoryId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      ).filter(item => item.quantity > 0)
      localStorage.setItem('cart', JSON.stringify(updated))
      return updated
    })
  }

  const removeItem = (inventoryId: string) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.inventory_id !== inventoryId)
      localStorage.setItem('cart', JSON.stringify(updated))
      return updated
    })
  }

  // Group by pharmacy
  const byPharmacy = cartItems.reduce((acc, item) => {
    if (!acc[item.pharmacy_id]) {
      acc[item.pharmacy_id] = { pharmacy_name: item.pharmacy_name, items: [] }
    }
    acc[item.pharmacy_id].items.push(item)
    return acc
  }, {} as Record<string, { pharmacy_name: string; items: CartItem[] }>)

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const DELIVERY_FEE = 15000
  const total = subtotal + DELIVERY_FEE

  const handleOrder = async () => {
    if (!address.trim()) return
    setLoading(true)

    try {
      // For MVP: create one order per pharmacy group
      const pharmacyId = Object.keys(byPharmacy)[0]
      const items = byPharmacy[pharmacyId].items.map(item => ({
        inventory_id: item.inventory_id,
        quantity: item.quantity,
      }))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacy_id: pharmacyId,
          items,
          delivery_address: address,
          notes,
        }),
      })

      const data = await res.json()
      if (data.order) {
        localStorage.removeItem('cart')
        router.push(`/order/${data.order.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex flex-col items-center justify-center px-4">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="font-bold text-gray-900 text-xl mb-2">Корзина пуста</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Добавьте лекарства из поиска или страниц аптек</p>
        <Link href="/search" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold">
          Найти лекарства
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-32">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="text-gray-600 text-xl">←</Link>
        <h1 className="font-semibold text-gray-900 flex-1">
          {step === 'cart' ? `Корзина (${cartItems.length})` : 'Оформление заказа'}
        </h1>
      </header>

      {step === 'cart' && (
        <div className="px-4 pt-4 space-y-4">
          {Object.entries(byPharmacy).map(([pharmacyId, { pharmacy_name, items }]) => (
            <div key={pharmacyId} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b bg-gray-50">
                <p className="font-medium text-gray-900 text-sm">🏪 {pharmacy_name}</p>
              </div>
              <div className="divide-y">
                {items.map(item => (
                  <div key={item.inventory_id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">💊</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.medicine_name}</p>
                      <p className="text-blue-600 font-semibold text-sm">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.inventory_id, -1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.inventory_id, 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.inventory_id)}
                        className="text-red-400 ml-1 text-lg"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Товары ({cartItems.length})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Доставка</span>
                <span>{formatPrice(DELIVERY_FEE)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                <span>Итого</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'checkout' && (
        <div className="px-4 pt-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Адрес доставки</h3>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Введите адрес доставки..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Заметки (необязательно)</h3>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Например: позвоните перед доставкой"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex justify-between font-bold text-gray-900 text-lg">
              <span>К оплате</span>
              <span className="text-blue-600">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Оплата наличными при получении</p>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 max-w-md mx-auto">
        {step === 'cart' ? (
          <button
            onClick={() => setStep('checkout')}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base"
          >
            Оформить заказ — {formatPrice(total)}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setStep('cart')}
              className="flex-1 border border-gray-300 text-gray-600 py-3.5 rounded-xl font-medium"
            >
              ← Назад
            </button>
            <button
              onClick={handleOrder}
              disabled={loading || !address.trim()}
              className="flex-2 flex-1 bg-blue-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold"
            >
              {loading ? 'Оформление...' : 'Подтвердить заказ'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
