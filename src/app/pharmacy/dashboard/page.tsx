'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice, formatDateTime } from '@/lib/utils'
import type { Order } from '@/types'
import { ORDER_STATUS_LABELS } from '@/types'

export default function PharmacyDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ today_orders: 0, today_revenue: 0, pending_orders: 0, total_medicines: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'new' | 'active' | 'history'>('new')

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30_000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      const list: Order[] = data.orders || []
      setOrders(list)

      const today = new Date().toDateString()
      const todayOrders = list.filter(o => new Date(o.created_at).toDateString() === today)
      const todayDelivered = todayOrders.filter(o => o.status === 'delivered')
      setStats({
        today_orders: todayOrders.length,
        today_revenue: todayDelivered.reduce((s, o) => s + o.total_amount, 0),
        pending_orders: list.filter(o => o.status === 'created').length,
        total_medicines: 0, // загрузим отдельно если нужно
      })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId: string, status: string, reason?: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    })
    fetchOrders()
  }

  const newOrders    = orders.filter(o => o.status === 'created')
  const activeOrders = orders.filter(o => ['pharmacy_confirmed','courier_assigned','picked_up'].includes(o.status))
  const history      = orders.filter(o => ['delivered','cancelled'].includes(o.status))
  const displayed    = activeTab === 'new' ? newOrders : activeTab === 'active' ? activeOrders : history

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24 lg:max-w-4xl">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">Кабинет аптеки</h1>
          <p className="text-xs text-green-600">● Открыто</p>
        </div>
        <Link href="/pharmacy/inventory" className="text-blue-600 text-sm font-medium">Склад →</Link>
      </header>

      {/* Stats */}
      <div className="px-4 pt-4 pb-2 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{stats.today_orders}</div>
          <div className="text-xs text-gray-500">Заказов сегодня</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-lg font-bold text-green-600">{formatPrice(stats.today_revenue)}</div>
          <div className="text-xs text-gray-500">Выручка</div>
        </div>
        <div className={`rounded-xl p-3 shadow-sm ${stats.pending_orders > 0 ? 'bg-orange-50 border border-orange-100' : 'bg-white'}`}>
          <div className={`text-2xl font-bold ${stats.pending_orders > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{stats.pending_orders}</div>
          <div className="text-xs text-gray-500">Ожидают подтверждения</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{orders.length}</div>
          <div className="text-xs text-gray-500">Всего заказов</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 flex gap-2">
        {[
          { key: 'new',    label: 'Новые',    count: newOrders.length },
          { key: 'active', label: 'В работе', count: activeOrders.length },
          { key: 'history',label: 'История',  count: null },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium relative transition-colors ${activeTab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
            {t.label}
            {t.count && t.count > 0 ? (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{t.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {loading && <div className="text-center py-10 text-gray-400">Загрузка заказов...</div>}

        {!loading && displayed.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-500 text-sm">Нет заказов</p>
          </div>
        )}

        {displayed.map(order => (
          <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
                <p className="text-xs text-gray-400">{formatDateTime(order.created_at)}</p>
              </div>
              <span className="font-bold text-blue-600 text-sm">{formatPrice(order.total_amount)}</span>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="mb-2 space-y-0.5">
                {order.items.slice(0,3).map(item => (
                  <div key={item.id} className="text-xs text-gray-600">• {item.medicine_name} × {item.quantity}</div>
                ))}
                {order.items.length > 3 && <div className="text-xs text-gray-400">ещё {order.items.length - 3}...</div>}
              </div>
            )}

            <p className="text-xs text-gray-500 mb-3">📍 {order.delivery_address}</p>

            {order.status === 'created' && (
              <div className="flex gap-2">
                <button onClick={() => updateStatus(order.id, 'cancelled', 'Отклонено аптекой')}
                  className="flex-1 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-medium">Отклонить</button>
                <button onClick={() => updateStatus(order.id, 'pharmacy_confirmed')}
                  className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold">✓ Подтвердить</button>
              </div>
            )}
            {order.status === 'pharmacy_confirmed' && (
              <div className="bg-yellow-50 rounded-xl px-3 py-2 text-xs text-yellow-700 text-center">Ожидание курьера...</div>
            )}
            {['courier_assigned','picked_up'].includes(order.status) && (
              <div className="bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700 text-center">{ORDER_STATUS_LABELS[order.status]}</div>
            )}
            {order.status === 'delivered' && (
              <div className="bg-green-50 rounded-xl px-3 py-2 text-xs text-green-700 text-center">✓ Доставлено</div>
            )}
            {order.status === 'cancelled' && (
              <div className="bg-red-50 rounded-xl px-3 py-2 text-xs text-red-600 text-center">Отменено{order.cancelled_reason ? `: ${order.cancelled_reason}` : ''}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
