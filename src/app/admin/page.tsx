'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface Stats {
  total_users: number
  total_pharmacies: number
  total_orders: number
  revenue_today: number
  pending_pharmacies: number
  delivered_today: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [usersRes, pharmaciesRes, ordersRes] = await Promise.all([
        fetch('/api/admin/users?count=true'),
        fetch('/api/admin/pharmacies?count=true'),
        fetch('/api/orders'),
      ])
      const ordersData = await ordersRes.json()
      const orders = ordersData.orders || []
      const today = new Date().toDateString()
      const todayOrders = orders.filter((o: any) => new Date(o.created_at).toDateString() === today)
      const todayDelivered = todayOrders.filter((o: any) => o.status === 'delivered')

      // Базовая статистика из заказов (для MVP без отдельного admin API)
      setStats({
        total_users: 0,       // требует admin API
        total_pharmacies: 0,  // требует admin API
        total_orders: orders.length,
        revenue_today: todayDelivered.reduce((s: number, o: any) => s + o.total_amount, 0),
        pending_pharmacies: 0,
        delivered_today: todayDelivered.length,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24 lg:max-w-4xl">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <h1 className="font-bold text-gray-900">Админ панель</h1>
        <p className="text-xs text-gray-400">TezDavo Dashboard</p>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {loading && <div className="text-center py-10 text-gray-400">Загрузка статистики...</div>}

        {stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{stats.total_orders}</div>
                <div className="text-xs text-gray-500">Заказов всего</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-lg font-bold text-green-600">{formatPrice(stats.revenue_today)}</div>
                <div className="text-xs text-gray-500">Выручка сегодня</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{stats.delivered_today}</div>
                <div className="text-xs text-gray-500">Доставлено сегодня</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-amber-600">{stats.pending_pharmacies}</div>
                <div className="text-xs text-gray-500">Аптек на модерации</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {[
                {href:'/admin/users',      icon:'👥', label:'Пользователи',  desc:'Управление аккаунтами'},
                {href:'/admin/pharmacies', icon:'🏪', label:'Аптеки',        desc:'Верификация и модерация'},
                {href:'/admin/orders',     icon:'📦', label:'Все заказы',    desc:'История и статусы'},
              ].map((item, i, arr) => (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-4 py-4 hover:bg-gray-50 ${i < arr.length-1 ? 'border-b border-gray-100' : ''}`}>
                  <span className="text-xl w-8">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <span className="text-gray-300">›</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
