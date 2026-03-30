'use client'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types'
import type { Order, OrderStatus as TOrderStatus } from '@/types'

const STATUS_COLOR: Record<TOrderStatus, 'blue' | 'yellow' | 'orange' | 'purple' | 'green' | 'red' | 'gray'> = {
  created:             'blue',
  pharmacy_confirmed:  'yellow',
  courier_assigned:    'orange',
  picked_up:           'purple',
  delivered:           'green',
  cancelled:           'red',
}

export function OrderStatusBadge({ status }: { status: TOrderStatus }) {
  return <Badge color={STATUS_COLOR[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
}

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link href={`/order/${order.id}`} className="block bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-gray-900 text-sm">{order.order_number}</p>
          <p className="text-xs text-gray-400">{formatDateTime(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      {order.pharmacy && (
        <p className="text-sm text-gray-600 mb-1">🏪 {order.pharmacy.name}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">{order.items?.length || 0} позиции</p>
        <p className="font-bold text-gray-900 text-sm">{formatPrice(order.total_amount)}</p>
      </div>
    </Link>
  )
}
