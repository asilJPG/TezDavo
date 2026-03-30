'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { OrderCard } from '@/components/order/OrderCard'
import type { Order } from '@/types'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  useEffect(()=>{ fetch('/api/orders').then(r=>r.json()).then(d=>{setOrders(d.orders||[]);setLoading(false)}) },[])
  const filtered = orders.filter(o=>o.order_number.toLowerCase().includes(search.toLowerCase())||o.delivery_address.toLowerCase().includes(search.toLowerCase()))
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6"><Link href="/admin" className="text-gray-500 text-xl">←</Link><h1 className="font-bold text-gray-900 text-xl flex-1">Все заказы</h1><span className="text-sm text-gray-400">{orders.length}</span></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 mb-4"/>
        {loading && <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"/>)}</div>}
        <div className="space-y-3">{filtered.map(o=><OrderCard key={o.id} order={o}/>)}</div>
      </div>
    </AppLayout>
  )
}
