'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types'
import type { Order, OrderStatus } from '@/types'

const STEPS: OrderStatus[] = ['created','pharmacy_confirmed','courier_assigned','picked_up','delivered']
const ICONS: Record<OrderStatus, string> = { created:'📋', pharmacy_confirmed:'✅', courier_assigned:'🚴', picked_up:'📦', delivered:'🏠', cancelled:'❌' }

export default function OrderPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch_ = () => fetch(`/api/orders/${id}`).then(r => r.json()).then(d => { if(d.order) setOrder(d.order); setLoading(false) })
    fetch_()
    const t = setInterval(fetch_, 15_000)
    return () => clearInterval(t)
  }, [id])

  const cancel = async () => {
    await fetch(`/api/orders/${id}/status`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status:'cancelled',reason:'Отменено пользователем'}) })
    fetch(`/api/orders/${id}`).then(r => r.json()).then(d => { if(d.order) setOrder(d.order) })
  }

  if (loading) return <AppLayout><div className="p-8 max-w-xl mx-auto space-y-4">{Array.from({length:3}).map((_,i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"/>)}</div></AppLayout>
  if (!order)  return <AppLayout><div className="flex items-center justify-center h-64 text-gray-500">Заказ не найден</div></AppLayout>

  const stepIdx = STEPS.indexOf(order.status)
  const cancelled = order.status === 'cancelled'
  const delivered  = order.status === 'delivered'

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/profile/orders" className="text-gray-500 text-xl">←</Link>
          <div>
            <h1 className="font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-xs text-gray-400">{formatDateTime(order.created_at)}</p>
          </div>
        </div>

        {/* Status */}
        <div className={`rounded-2xl p-5 shadow-sm ${delivered ? 'bg-green-50 border border-green-200' : cancelled ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{ICONS[order.status]}</span>
            <div>
              <div className={`font-bold text-lg ${delivered ? 'text-green-700' : cancelled ? 'text-red-700' : 'text-gray-900'}`}>{ORDER_STATUS_LABELS[order.status]}</div>
              {order.courier && !delivered && !cancelled && <p className="text-sm text-gray-500">Курьер: {order.courier.full_name}</p>}
            </div>
          </div>
          {!cancelled && (
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${i <= stepIdx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{i < stepIdx ? '✓' : i+1}</div>
                  {i < STEPS.length-1 && <div className={`flex-1 h-0.5 mx-1 ${i < stepIdx ? 'bg-blue-600' : 'bg-gray-200'}`}/>}
                </div>
              ))}
            </div>
          )}
          {cancelled && order.cancelled_reason && <p className="text-sm text-red-600 mt-2">Причина: {order.cancelled_reason}</p>}
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          {order.pharmacy && <div className="flex gap-2"><span className="text-lg">🏪</span><div><p className="font-medium text-gray-900 text-sm">{order.pharmacy.name}</p><p className="text-xs text-gray-400">{order.pharmacy.address}</p></div></div>}
          <div className="flex gap-2"><span className="text-lg">📍</span><div><p className="font-medium text-gray-900 text-sm">Адрес доставки</p><p className="text-xs text-gray-400">{order.delivery_address}</p></div></div>
          {order.courier && (
            <div className="flex items-center gap-2">
              <span className="text-lg">🚴</span>
              <div className="flex-1"><p className="font-medium text-gray-900 text-sm">{order.courier.full_name}</p><p className="text-xs text-gray-400">Курьер</p></div>
              <a href={`tel:${order.courier.phone}`} className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-xl font-medium">📞 Позвонить</a>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Состав заказа</h3>
          <div className="space-y-2">
            {order.items?.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-base">💊</span><div><p className="text-sm text-gray-900">{item.medicine_name}</p><p className="text-xs text-gray-400">{item.quantity} × {formatPrice(item.unit_price)}</p></div></div>
                <span className="font-medium text-gray-900 text-sm">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-600"><span>Товары</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm text-gray-600"><span>Доставка</span><span>{formatPrice(order.delivery_fee)}</span></div>
            <div className="flex justify-between font-bold text-gray-900"><span>Итого</span><span>{formatPrice(order.total_amount)}</span></div>
          </div>
        </div>

        {order.status === 'created' && <button onClick={cancel} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium text-sm border border-red-200">Отменить заказ</button>}
        {delivered && <Link href="/search" className="block w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm text-center">Сделать новый заказ</Link>}
      </div>
    </AppLayout>
  )
}
