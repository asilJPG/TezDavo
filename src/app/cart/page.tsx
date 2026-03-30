'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const router = useRouter()
  const { items, count, subtotal, deliveryFee, total, updateQuantity, removeItem, clear, pharmacyId } = useCart()
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState<'cart'|'checkout'>('cart')
  const [loading, setLoading] = useState(false)

  const handleOrder = async () => {
    if (!address.trim() || !pharmacyId) return
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacy_id: pharmacyId,
          items: items.map(i => ({ inventory_id: i.inventory_id, quantity: i.quantity })),
          delivery_address: address, notes,
        }),
      })
      const data = await res.json()
      if (data.order) { clear(); router.push(`/order/${data.order.id}`) }
    } finally { setLoading(false) }
  }

  if (count === 0) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="font-bold text-gray-900 text-xl mb-2">Корзина пуста</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Добавьте лекарства из поиска</p>
        <Link href="/search" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold">Найти лекарства</Link>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          {step === 'checkout' && <button onClick={() => setStep('cart')} className="text-gray-500 text-xl">←</button>}
          <h1 className="font-bold text-gray-900 text-xl">{step === 'cart' ? `Корзина (${count})` : 'Оформление заказа'}</h1>
        </div>

        {step === 'cart' && (
          <div className="space-y-4">
            {/* Grouped by pharmacy */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {items[0] && <div className="px-4 py-3 border-b bg-gray-50 text-sm font-medium text-gray-700">🏪 {items[0].pharmacy_name}</div>}
              <div className="divide-y">
                {items.map(item => (
                  <div key={item.inventory_id} className="px-4 py-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-2xl">💊</span></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.medicine_name}</p>
                      <p className="text-blue-600 font-semibold text-sm">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.inventory_id, item.quantity - 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 text-sm">−</button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.inventory_id, item.quantity + 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 text-sm">+</button>
                      <button onClick={() => removeItem(item.inventory_id)} className="text-red-400 text-lg ml-1">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Товары</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-gray-600">
                <span>Доставка</span>
                <span>{deliveryFee === 0 ? <span className="text-green-600">Бесплатно</span> : formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t"><span>Итого</span><span>{formatPrice(total)}</span></div>
            </div>

            <button onClick={() => setStep('checkout')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base">
              Оформить — {formatPrice(total)}
            </button>
          </div>
        )}

        {step === 'checkout' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Адрес доставки *</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Введите адрес..." rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none"/>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Комментарий курьеру</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Например: позвоните перед доставкой"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"/>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex justify-between font-bold text-gray-900 text-lg"><span>К оплате</span><span className="text-blue-600">{formatPrice(total)}</span></div>
              <p className="text-xs text-gray-500 mt-1">Оплата наличными при получении</p>
            </div>
            <button onClick={handleOrder} disabled={loading || !address.trim()}
              className="w-full bg-blue-600 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-base">
              {loading ? 'Оформляем...' : 'Подтвердить заказ'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
