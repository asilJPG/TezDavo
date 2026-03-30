'use client'
// src/app/order/[id]/page.tsx — Отслеживание заказа

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Order, OrderStatus, ORDER_STATUS_LABELS, formatPrice } from '@/types'

const STATUS_STEPS: OrderStatus[] = [
  'created',
  'pharmacy_confirmed',
  'courier_assigned',
  'picked_up',
  'delivered',
]

const STATUS_ICONS: Record<OrderStatus, string> = {
  created: '📋',
  pharmacy_confirmed: '✅',
  courier_assigned: '🚴',
  picked_up: '📦',
  delivered: '🏠',
  cancelled: '❌',
}

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
    // Poll every 15s for live updates
    const interval = setInterval(fetchOrder, 15000)
    return () => clearInterval(interval)
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      const data = await res.json()
      if (data.order) setOrder(data.order)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center max-w-md mx-auto">
        <div className="text-center">
          <p className="text-gray-500">Заказ не найден</p>
          <Link href="/profile/orders" className="text-blue-600 mt-2 block">← Мои заказы</Link>
        </div>
      </div>
    )
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">Заказ {order.order_number}</h1>
          <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('ru-RU')}</p>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Status card */}
        <div className={`rounded-2xl p-5 shadow-sm ${isDelivered ? 'bg-green-50 border border-green-200' : isCancelled ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{STATUS_ICONS[order.status]}</span>
            <div>
              <div className={`font-bold text-lg ${isDelivered ? 'text-green-700' : isCancelled ? 'text-red-700' : 'text-gray-900'}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </div>
              {order.courier && order.status !== 'delivered' && order.status !== 'cancelled' && (
                <p className="text-sm text-gray-500">Курьер: {order.courier.full_name}</p>
              )}
            </div>
          </div>

          {/* Progress steps */}
          {!isCancelled && (
            <div className="flex items-center gap-1">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    i <= currentStepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i < currentStepIndex ? '✓' : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {order.cancelled_reason && (
            <p className="text-sm text-red-600 mt-2">Причина: {order.cancelled_reason}</p>
          )}
        </div>

        {/* Pharmacy & delivery info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Информация о заказе</h3>

          {order.pharmacy && (
            <div className="flex items-start gap-2">
              <span className="text-lg mt-0.5">🏪</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">{order.pharmacy.name}</p>
                <p className="text-xs text-gray-400">{order.pharmacy.address}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">📍</span>
            <div>
              <p className="font-medium text-gray-900 text-sm">Адрес доставки</p>
              <p className="text-xs text-gray-400">{order.delivery_address}</p>
            </div>
          </div>

          {order.courier && (
            <div className="flex items-center gap-2">
              <span className="text-lg">🚴</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{order.courier.full_name}</p>
                <p className="text-xs text-gray-400">Курьер</p>
              </div>
              <a
                href={`tel:${order.courier.phone}`}
                className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-xl font-medium"
              >
                📞 Позвонить
              </a>
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Состав заказа</h3>
          <div className="space-y-2">
            {order.items?.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">💊</span>
                  <div>
                    <p className="text-sm text-gray-900">{item.medicine_name}</p>
                    <p className="text-xs text-gray-400">{item.quantity} × {formatPrice(item.unit_price)}</p>
                  </div>
                </div>
                <span className="font-medium text-gray-900 text-sm">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>

          <div className="border-t mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Товары</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Доставка</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900">
              <span>Итого</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {order.status === 'created' && (
          <button
            className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium text-sm border border-red-200"
            onClick={async () => {
              await fetch(`/api/orders/${order.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled', reason: 'Отменено пользователем' }),
              })
              fetchOrder()
            }}
          >
            Отменить заказ
          </button>
        )}

        {isDelivered && (
          <Link href="/search" className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm text-center">
            Сделать новый заказ
          </Link>
        )}
      </div>
    </div>
  )
}
