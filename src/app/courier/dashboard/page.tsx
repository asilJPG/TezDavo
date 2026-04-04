"use client";
import { useState, useEffect, useRef } from "react";
import { CourierLayout } from "@/components/layout/CourierLayout";
import { GoogleMap } from "@/components/map/GoogleMap";
import { formatPrice, formatDateTime } from "@/lib/utils";
import type { Order } from "@/types";

export default function CourierDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"available" | "my" | "history">("available");
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    // Загружаем статус онлайн с сервера при маунте
    fetch("/api/couriers/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.courier?.is_available) setIsOnline(true);
      });
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        // Отправляем на сервер не чаще раза в 10 секунд
        const now = Date.now();
        if (isOnline && now - lastUpdateRef.current > 10_000) {
          lastUpdateRef.current = now;
          fetch("/api/couriers/location", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: loc.lat,
              lng: loc.lng,
              is_available: true,
            }),
          });
        }
      },
      null,
      { enableHighAccuracy: true, maximumAge: 5_000 },
    );
    return () => {
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isOnline]);

  const load = async () => {
    try {
      const r = await fetch("/api/couriers/orders");
      const d = await r.json();
      setOrders(d.orders || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = async (v: boolean) => {
    setIsOnline(v);
    await fetch("/api/couriers/location", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: v, ...(myLocation || {}) }),
    });
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const openYandex = (order: Order) => {
    const from = myLocation ? `${myLocation.lat},${myLocation.lng}` : "";
    window.open(
      `https://yandex.uz/maps/?rtext=${from}~${order.delivery_lat},${order.delivery_lng}&rtt=auto`,
      "_blank",
    );
  };

  const openGoogle = (order: Order) => {
    const from = myLocation ? `${myLocation.lat},${myLocation.lng}` : "";
    window.open(
      `https://maps.google.com/maps?saddr=${from}&daddr=${order.delivery_lat},${order.delivery_lng}&dirflg=d`,
      "_blank",
    );
  };

  const available = orders.filter((o) => o.status === "pharmacy_confirmed");
  const myOrders = orders.filter((o) =>
    ["courier_assigned", "picked_up"].includes(o.status),
  );
  const history = orders.filter((o) =>
    ["delivered", "cancelled"].includes(o.status),
  );
  const delivered = history.filter((o) => o.status === "delivered");
  // Если офлайн — скрываем доступные заказы
  const displayed =
    tab === "available"
      ? isOnline
        ? available
        : []
      : tab === "my"
        ? myOrders
        : history;

  return (
    <CourierLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-bold text-gray-900 text-xl">Кабинет курьера</h1>
            <p
              className={`text-xs ${isOnline ? "text-green-600" : "text-gray-400"}`}
            >
              {isOnline ? "● Онлайн" : "○ Офлайн"}
            </p>
          </div>
          <button
            onClick={() => toggleOnline(!isOnline)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${isOnline ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {isOnline ? "В сети" : "Выйти в сеть"}
          </button>
        </div>

        {/* Карта активного маршрута */}
        {selectedOrder && myLocation && selectedOrder.delivery_lat && (
          <div className="mb-4 bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-semibold text-gray-900">
                🗺 Маршрут доставки
              </p>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 text-sm"
              >
                ✕
              </button>
            </div>
            <GoogleMap
              center={myLocation}
              zoom={14}
              markers={[
                {
                  lat: myLocation.lat,
                  lng: myLocation.lng,
                  title: "Я",
                  type: "courier",
                },
                {
                  lat: selectedOrder.delivery_lat!,
                  lng: selectedOrder.delivery_lng!,
                  title: "Клиент",
                  type: "destination",
                },
              ]}
              routeFrom={myLocation}
              routeTo={{
                lat: selectedOrder.delivery_lat!,
                lng: selectedOrder.delivery_lng!,
              }}
              height="220px"
            />
            <div className="grid grid-cols-2 gap-2 p-3">
              <button
                onClick={() => openYandex(selectedOrder)}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-yellow-400 text-yellow-900 rounded-xl text-sm font-semibold"
              >
                🗺 Яндекс Карты
              </button>
              <button
                onClick={() => openGoogle(selectedOrder)}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
              >
                🗺 Google Maps
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-xl font-bold text-blue-600">
              {delivered.length}
            </div>
            <div className="text-xs text-gray-500">Доставлено</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-sm font-bold text-green-600">
              {formatPrice(delivered.length * 5000)}
            </div>
            <div className="text-xs text-gray-500">Заработок</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-xl font-bold text-amber-600">
              {available.length}
            </div>
            <div className="text-xs text-gray-500">Доступно</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {[
            { k: "available", l: "Доступные", c: available.length },
            { k: "my", l: "Мои", c: myOrders.length },
            { k: "history", l: "История", c: null },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium relative transition-colors ${tab === t.k ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
            >
              {t.l}
              {t.c !== null && t.c > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {t.c}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}
        {!loading && displayed.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">🚴</div>
            <p className="text-gray-500 text-sm">
              {tab === "available" && !isOnline
                ? "Выйдите в сеть чтобы видеть заказы"
                : "Нет заказов"}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {displayed.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm">{order.order_number}</span>
                <span className="font-bold text-green-600 text-sm">
                  +5 000 сум
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1">
                {formatDateTime(order.created_at)}
              </p>
              {order.pharmacy && (
                <p className="text-xs text-gray-600 mb-1">
                  🏪 {(order.pharmacy as any).name}
                </p>
              )}
              <p className="text-xs text-gray-600 mb-3">
                📍 {order.delivery_address}
              </p>
              <div className="flex justify-between mb-3">
                <span className="text-xs text-gray-500">
                  {order.items?.length || 0} позиции
                </span>
                <span className="text-sm font-bold">
                  {formatPrice(order.total_amount)}
                </span>
              </div>

              {tab === "available" && (
                <button
                  onClick={() => updateStatus(order.id, "courier_assigned")}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
                >
                  Принять заказ
                </button>
              )}

              {(order.status === "courier_assigned" ||
                order.status === "picked_up") && (
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setSelectedOrder(
                        selectedOrder?.id === order.id ? null : order,
                      )
                    }
                    className="w-full py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-medium"
                  >
                    🗺{" "}
                    {selectedOrder?.id === order.id
                      ? "Скрыть маршрут"
                      : "Показать маршрут"}
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openYandex(order)}
                      className="py-2 bg-yellow-400 text-yellow-900 rounded-xl text-xs font-semibold"
                    >
                      Яндекс
                    </button>
                    <button
                      onClick={() => openGoogle(order)}
                      className="py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Google
                    </button>
                    {order.status === "courier_assigned" ? (
                      <button
                        onClick={() => updateStatus(order.id, "picked_up")}
                        className="py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold"
                      >
                        Забрал
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(order.id, "delivered")}
                        className="py-2 bg-green-600 text-white rounded-xl text-xs font-semibold"
                      >
                        ✓ Доставил
                      </button>
                    )}
                  </div>
                </div>
              )}

              {order.status === "delivered" && (
                <div className="text-center text-xs text-green-600 font-medium">
                  ✓ Доставлено
                </div>
              )}
              {order.status === "cancelled" && (
                <div className="text-center text-xs text-red-500">Отменено</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </CourierLayout>
  );
}
