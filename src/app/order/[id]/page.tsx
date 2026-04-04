"use client";
// src/app/order/[id]/page.tsx
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { GoogleMap } from "@/components/map/GoogleMap";
import { ReviewsSection } from "@/components/pharmacy/ReviewsSection";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/types";
import type { Order, OrderStatus } from "@/types";

const STEPS: OrderStatus[] = [
  "created",
  "pharmacy_confirmed",
  "courier_assigned",
  "picked_up",
  "delivered",
];
const ICONS: Record<OrderStatus, string> = {
  created: "📋",
  pharmacy_confirmed: "✅",
  courier_assigned: "🚴",
  picked_up: "📦",
  delivered: "🏠",
  cancelled: "❌",
};

interface CourierLocation {
  lat: number;
  lng: number;
}

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [courierLocation, setCourierLocation] =
    useState<CourierLocation | null>(null);

  const fetchOrder = () =>
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order) setOrder(d.order);
        setLoading(false);
      });

  // Получаем локацию курьера
  const fetchCourierLocation = async (courierId: string) => {
    const res = await fetch(`/api/couriers/${courierId}/location`);
    const data = await res.json();
    if (data.lat && data.lng)
      setCourierLocation({ lat: data.lat, lng: data.lng });
  };

  useEffect(() => {
    fetchOrder();
    const t = setInterval(fetchOrder, 15_000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => {
    if (!order?.courier_id) return;
    if (!["courier_assigned", "picked_up"].includes(order.status)) return;

    fetchCourierLocation(order.courier_id);
    const t = setInterval(
      () => fetchCourierLocation(order.courier_id!),
      10_000,
    );
    return () => clearInterval(t);
  }, [order?.courier_id, order?.status]);

  const cancel = async () => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "cancelled",
        reason: "Отменено пользователем",
      }),
    });
    fetchOrder();
  };

  if (loading)
    return (
      <AppLayout>
        <div className="p-8 max-w-xl mx-auto space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </AppLayout>
    );

  if (!order)
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Заказ не найден
        </div>
      </AppLayout>
    );

  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const isActive = ["courier_assigned", "picked_up"].includes(order.status);
  const currentStep = STEPS.indexOf(order.status as OrderStatus);

  // Маркеры на карте
  const mapMarkers = [
    ...(courierLocation
      ? [
          {
            lat: courierLocation.lat,
            lng: courierLocation.lng,
            title: "Курьер",
            type: "courier" as const,
          },
        ]
      : []),
    ...(order.delivery_lat && order.delivery_lng
      ? [
          {
            lat: order.delivery_lat,
            lng: order.delivery_lng,
            title: "Адрес доставки",
            type: "destination" as const,
          },
        ]
      : []),
  ];

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile/orders" className="text-gray-500 text-xl">
            ←
          </Link>
          <h1 className="font-bold text-gray-900 text-xl flex-1">
            Заказ {order.order_number}
          </h1>
        </div>

        {/* Карта — показываем только когда курьер назначен */}
        {isActive && mapMarkers.length > 0 && (
          <div className="mb-4">
            <GoogleMap
              markers={mapMarkers}
              routeFrom={courierLocation || undefined}
              routeTo={
                order.delivery_lat && order.delivery_lng
                  ? { lat: order.delivery_lat, lng: order.delivery_lng }
                  : undefined
              }
              center={
                courierLocation || {
                  lat: order.delivery_lat || 41.2995,
                  lng: order.delivery_lng || 69.2401,
                }
              }
              zoom={14}
              height="250px"
              className="shadow-sm"
            />
            <p className="text-xs text-gray-400 text-center mt-2">
              Местоположение курьера обновляется каждые 10 секунд
            </p>
          </div>
        )}

        {/* Status */}
        <div
          className={`rounded-2xl p-4 shadow-sm mb-4 ${isCancelled ? "bg-red-50" : isDelivered ? "bg-green-50" : "bg-white"}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">
              {ICONS[order.status as OrderStatus]}
            </span>
            <div>
              <p className="font-bold text-gray-900">
                {ORDER_STATUS_LABELS[order.status as OrderStatus]}
              </p>
              <p className="text-xs text-gray-400">
                {formatDateTime(order.created_at)}
              </p>
            </div>
          </div>

          {/* Progress steps */}
          {!isCancelled && (
            <div className="flex items-center">
              {STEPS.map((step, i) => (
                <div
                  key={step}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                      i <= currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {ICONS[step]}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-1 rounded ${i < currentStep ? "bg-blue-600" : "bg-gray-100"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          {order.pharmacy && (
            <div className="flex gap-3">
              <span className="text-xl">🏪</span>
              <div>
                <p className="text-xs text-gray-400">Аптека</p>
                <p className="font-medium text-gray-900 text-sm">
                  {(order.pharmacy as any).name}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="text-xs text-gray-400">Адрес доставки</p>
              <p className="font-medium text-gray-900 text-sm">
                {order.delivery_address}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Состав заказа</p>
          </div>
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 flex justify-between items-center border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.medicine_name}
                </p>
                <p className="text-xs text-gray-400">{item.quantity} шт.</p>
              </div>
              <p className="font-semibold text-gray-900 text-sm">
                {formatPrice(item.unit_price * item.quantity)}
              </p>
            </div>
          ))}
          <div className="px-4 py-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Товары</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Доставка</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t">
              <span>Итого</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Cancel button */}
        {["created", "pharmacy_confirmed"].includes(order.status) && (
          <button
            onClick={cancel}
            className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50"
          >
            Отменить заказ
          </button>
        )}

        {/* Review section for delivered orders */}
        {isDelivered && order.pharmacy_id && (
          <div className="mt-4">
            <ReviewsSection pharmacyId={order.pharmacy_id} orderId={order.id} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
