'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/order/OrderCard'
import type { Order } from '@/types'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false) })
  }, [])

  const filtered = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.delivery_address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24 lg:max-w-4xl">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/admin" className="text-gray-600 text-xl">←</Link>
        <h1 className="font-semibold text-gray-900 flex-1">Все заказы</h1>
        <span className="text-sm text-gray-400">{orders.length}</span>
      </header>
      <div className="px-4 pt-4 space-y-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по номеру или адресу..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
        {loading && <div className="text-center py-10 text-gray-400">Загрузка...</div>}
        {filtered.map(order => (
          <Link key={order.id} href={`/order/${order.id}`} className="block bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-400 mb-1">{formatDateTime(order.created_at)}</p>
            {order.pharmacy && <p className="text-xs text-gray-600">🏪 {order.pharmacy.name}</p>}
            <p className="text-xs text-gray-600">📍 {order.delivery_address}</p>
            <p className="text-sm font-bold text-gray-900 mt-2">{formatPrice(order.total_amount)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
