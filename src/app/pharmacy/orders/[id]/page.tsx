"use client";
// src/app/pharmacy/orders/[id]/page.tsx
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PharmacyLayout } from "@/components/layout/PharmacyLayout";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/types";
import type { Order, OrderStatus } from "@/types";

const STATUS_COLOR: Record<string, string> = {
  created: "bg-blue-50 text-blue-700",
  pharmacy_confirmed: "bg-yellow-50 text-yellow-700",
  courier_assigned: "bg-purple-50 text-purple-700",
  picked_up: "bg-orange-50 text-orange-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};

export default function PharmacyOrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    if (data.order) setOrder(data.order);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      load();
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <PharmacyLayout>
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </PharmacyLayout>
    );

  if (!order)
    return (
      <PharmacyLayout>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Заказ не найден
        </div>
      </PharmacyLayout>
    );

  return (
    <PharmacyLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/pharmacy/dashboard" className="text-gray-500 text-xl">
            ←
          </Link>
          <h1 className="font-bold text-gray-900 text-xl flex-1">
            Заказ {order.order_number}
          </h1>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLOR[order.status] || ""}`}
          >
            {ORDER_STATUS_LABELS[order.status as OrderStatus]}
          </span>
        </div>

        {/* Время */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Создан</p>
              <p className="font-medium text-gray-900">
                {formatDateTime(order.created_at)}
              </p>
            </div>
            {order.confirmed_at && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Подтверждён</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(order.confirmed_at)}
                </p>
              </div>
            )}
            {order.delivered_at && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Доставлен</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(order.delivered_at)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Клиент и адрес */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">Доставка</h2>
          <div className="flex gap-3">
            <span className="text-lg">📍</span>
            <div>
              <p className="text-xs text-gray-400">Адрес</p>
              <p className="text-sm font-medium text-gray-900">
                {order.delivery_address}
              </p>
            </div>
          </div>
          {order.notes && (
            <div className="flex gap-3">
              <span className="text-lg">💬</span>
              <div>
                <p className="text-xs text-gray-400">Комментарий</p>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Товары */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Состав заказа</p>
            <span className="text-xs text-gray-400">
              {order.items?.length || 0} позиции
            </span>
          </div>
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 flex items-center gap-3 border-b last:border-0"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💊</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.medicine_name}
                </p>
                <p className="text-xs text-gray-400">
                  {item.quantity} шт. × {formatPrice(item.unit_price)}
                </p>
              </div>
              <p className="font-semibold text-gray-900 text-sm flex-shrink-0">
                {formatPrice(item.unit_price * item.quantity)}
              </p>
            </div>
          ))}
          <div className="px-4 py-3 space-y-1.5 text-sm bg-gray-50">
            <div className="flex justify-between text-gray-500">
              <span>Товары</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Доставка</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t">
              <span>Итого</span>
              <span className="text-blue-600">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Курьер */}
        {order.courier_id && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">Курьер</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">
                🚴
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Курьер назначен
                </p>
                <p className="text-xs text-gray-400">
                  {order.assigned_at ? formatDateTime(order.assigned_at) : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {order.status === "created" && (
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus("cancelled")}
                disabled={updating}
                className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl text-sm font-medium disabled:opacity-50"
              >
                ✕ Отклонить
              </button>
              <button
                onClick={() => updateStatus("pharmacy_confirmed")}
                disabled={updating}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {updating ? "..." : "✓ Подтвердить"}
              </button>
            </div>
          )}
          {order.status === "pharmacy_confirmed" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 text-center">
              ⏳ Ожидание курьера...
            </div>
          )}
          {["courier_assigned", "picked_up"].includes(order.status) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 text-center">
              🚴 {ORDER_STATUS_LABELS[order.status as OrderStatus]}
            </div>
          )}
          {order.status === "delivered" && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center font-medium">
              ✓ Заказ доставлен
            </div>
          )}
          {order.status === "cancelled" && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
              ✕ Заказ отменён{" "}
              {order.cancelled_reason ? `— ${order.cancelled_reason}` : ""}
            </div>
          )}
        </div>
      </div>
    </PharmacyLayout>
  );
}
