'use client'
// src/app/profile/orders/page.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/BottomNav'
import { OrderCard } from '@/components/order/OrderCard'
import { Spinner } from '@/components/ui/Button'
import type { Order } from '@/types'

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(data.orders || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      <PageHeader title="История заказов" />

      <div className="px-4 pt-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-gray-500">У вас ещё нет заказов</p>
            <Link href="/search" className="text-blue-600 text-sm mt-2 block font-medium">
              Найти лекарства →
            </Link>
          </div>
        )}

        {orders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}
