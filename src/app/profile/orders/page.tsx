'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { OrderCard } from '@/components/order/OrderCard'
import type { Order } from '@/types'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/orders').then(r=>r.json()).then(d=>{setOrders(d.orders||[]);setLoading(false)}) }, [])
  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6"><Link href="/profile" className="text-gray-500 text-xl">←</Link><h1 className="font-bold text-gray-900 text-xl">История заказов</h1></div>
        {loading && <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"/>)}</div>}
        {!loading && orders.length === 0 && <div className="text-center py-16"><div className="text-5xl mb-3">📦</div><p className="text-gray-500">Нет заказов</p><Link href="/search" className="text-blue-600 text-sm mt-2 block font-medium">Найти лекарства →</Link></div>}
        <div className="space-y-3">{orders.map(o=><OrderCard key={o.id} order={o}/>)}</div>
      </div>
    </AppLayout>
  )
}
