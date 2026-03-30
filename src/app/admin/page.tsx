'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { formatPrice } from '@/lib/utils'

export default function AdminDashboard() {
  const [stats, setStats] = useState({total_orders:0,revenue_today:0,delivered_today:0,pending_pharmacies:0})
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/orders').then(r=>r.json()).then(d=>{
      const orders=d.orders||[]; const today=new Date().toDateString()
      const todayO=orders.filter((o:any)=>new Date(o.created_at).toDateString()===today)
      const todayD=todayO.filter((o:any)=>o.status==='delivered')
      setStats({total_orders:orders.length,revenue_today:todayD.reduce((s:number,o:any)=>s+o.total_amount,0),delivered_today:todayD.length,pending_pharmacies:0})
      setLoading(false)
    })
  },[])
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-bold text-gray-900 text-xl mb-6">Админ панель</h1>
        {loading && <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"/>)}</div>}
        {!loading && (<>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-2xl font-bold text-purple-600">{stats.total_orders}</div><div className="text-xs text-gray-500">Заказов всего</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-lg font-bold text-green-600">{formatPrice(stats.revenue_today)}</div><div className="text-xs text-gray-500">Выручка сегодня</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-2xl font-bold text-blue-600">{stats.delivered_today}</div><div className="text-xs text-gray-500">Доставлено сегодня</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-2xl font-bold text-amber-600">{stats.pending_pharmacies}</div><div className="text-xs text-gray-500">На модерации</div></div>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {[{href:'/admin/users',icon:'👥',label:'Пользователи',desc:'Управление аккаунтами'},{href:'/admin/pharmacies',icon:'🏪',label:'Аптеки',desc:'Верификация'},{href:'/admin/orders',icon:'📦',label:'Все заказы',desc:'История'}].map((item,i,arr)=>(
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-4 hover:bg-gray-50 ${i<arr.length-1?'border-b border-gray-100':''}`}>
                <span className="text-xl w-8">{item.icon}</span><div className="flex-1"><p className="font-medium text-gray-900 text-sm">{item.label}</p><p className="text-xs text-gray-400">{item.desc}</p></div><span className="text-gray-300">›</span>
              </Link>
            ))}
          </div>
        </>)}
      </div>
    </AppLayout>
  )
}
