'use client'
import { useState, useEffect } from 'react'
import { formatPrice, formatDateTime } from '@/lib/utils'
import type { Order } from '@/types'

export default function CourierDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'available'|'my'|'history'>('available')

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 20_000)
    return () => clearInterval(interval)
  }, [])

  // Обновляем статус онлайн/офлайн в БД
  const toggleOnline = async (online: boolean) => {
    setIsOnline(online)
    await fetch('/api/couriers/location', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: online }),
    })
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(data.orders || [])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchOrders()
  }

  const available = orders.filter(o => o.status === 'pharmacy_confirmed')
  const myOrders  = orders.filter(o => ['courier_assigned','picked_up'].includes(o.status))
  const history   = orders.filter(o => ['delivered','cancelled'].includes(o.status))
  const delivered = history.filter(o => o.status === 'delivered')
  const displayed = activeTab === 'available' ? available : activeTab === 'my' ? myOrders : history

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24 lg:max-w-2xl">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">Кабинет курьера</h1>
          <p className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>{isOnline ? '● Онлайн' : '○ Офлайн'}</p>
        </div>
        <button onClick={() => toggleOnline(!isOnline)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${isOnline ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {isOnline ? 'В сети' : 'Выйти в сеть'}
        </button>
      </header>

      {/* Stats */}
      <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <div className="text-xl font-bold text-blue-600">{delivered.length}</div>
          <div className="text-xs text-gray-500">Доставлено</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <div className="text-sm font-bold text-green-600">{formatPrice(delivered.length * 5000)}</div>
          <div className="text-xs text-gray-500">Заработок</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <div className="text-xl font-bold text-amber-600">{available.length}</div>
          <div className="text-xs text-gray-500">Доступно</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 flex gap-2">
        {[
          {key:'available', label:'Доступные', count: available.length},
          {key:'my',        label:'Мои',       count: myOrders.length},
          {key:'history',   label:'История',   count: null},
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium relative transition-colors ${activeTab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
            {t.label}
            {t.count && t.count > 0 ? <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{t.count}</span> : null}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {loading && <div className="text-center py-10 text-gray-400">Загрузка...</div>}
        {!loading && displayed.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">🚴</div>
            <p className="text-gray-500 text-sm">
              {activeTab === 'available' && !isOnline ? 'Выйдите в сеть чтобы видеть заказы' : 'Нет заказов'}
            </p>
          </div>
        )}
        {displayed.map(order => (
          <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
              <span className="font-bold text-green-600 text-sm">+5 000 сум</span>
            </div>
            <div className="text-xs text-gray-400 mb-1">{formatDateTime(order.created_at)}</div>
            {order.pharmacy && (
              <p className="text-xs text-gray-600 mb-1">🏪 {order.pharmacy.name} — {order.pharmacy.address}</p>
            )}
            <p className="text-xs text-gray-600 mb-3">📍 {order.delivery_address}</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{order.items?.length || 0} позиции</span>
              <span className="text-sm font-bold text-gray-900">{formatPrice(order.total_amount)}</span>
            </div>

            {activeTab === 'available' && (
              <button onClick={() => updateStatus(order.id, 'courier_assigned')}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">Принять заказ</button>
            )}
            {order.status === 'courier_assigned' && (
              <div className="flex gap-2">
                <a href={`https://maps.google.com/?q=${order.delivery_lat},${order.delivery_lng}`} target="_blank" rel="noreferrer"
                  className="flex-1 py-2 border border-blue-200 text-blue-600 rounded-xl text-xs font-medium text-center">🗺 Маршрут</a>
                <button onClick={() => updateStatus(order.id, 'picked_up')}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold">Забрал из аптеки</button>
              </div>
            )}
            {order.status === 'picked_up' && (
              <button onClick={() => updateStatus(order.id, 'delivered')}
                className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold">✓ Доставлено</button>
            )}
            {order.status === 'delivered' && <div className="text-center text-xs text-green-600 font-medium">✓ Доставлено</div>}
            {order.status === 'cancelled' && <div className="text-center text-xs text-red-500">Отменено</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
