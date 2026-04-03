"use client";
import { useState, useEffect } from "react";
import { PharmacyLayout } from "@/components/layout/PharmacyLayout";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/types";
import type { Order } from "@/types";
import Link from "next/link";

interface PharmacyInfo {
  id: string;
  name: string;
  is_verified: boolean;
  is_active: boolean;
}

function PendingScreen({ pharmacy }: { pharmacy: PharmacyInfo }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="font-bold text-gray-900 text-xl mb-2">
          Заявка на рассмотрении
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Ваша аптека{" "}
          <span className="font-semibold text-gray-700">«{pharmacy.name}»</span>{" "}
          отправлена на модерацию. Обычно это занимает 1–2 рабочих дня.
        </p>
        <div className="bg-white rounded-2xl p-5 shadow-sm text-left space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm">
              ✓
            </div>
            <span className="text-sm text-gray-700">Заявка получена</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm">
              ⏳
            </div>
            <span className="text-sm text-gray-700">Проверка лицензии</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-sm">
              ○
            </div>
            <span className="text-sm text-gray-400">Активация аптеки</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Вы получите уведомление когда аптека будет активирована
        </p>
      </div>
    </div>
  );
}

export default function PharmacyDashboard() {
  const [pharmacy, setPharmacy] = useState<PharmacyInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"new" | "active" | "history">("new");

  useEffect(() => {
    loadPharmacy();
  }, []);

  const loadPharmacy = async () => {
    try {
      const res = await fetch("/api/pharmacies/my");
      const data = await res.json();
      setPharmacy(data.pharmacy);
      if (data.pharmacy?.is_verified) loadOrders();
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders || []);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  };

  if (loading) {
    return (
      <PharmacyLayout>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </PharmacyLayout>
    );
  }

  if (!pharmacy || !pharmacy.is_verified) {
    return (
      <PharmacyLayout>
        <PendingScreen
          pharmacy={
            pharmacy || {
              id: "",
              name: "Ваша аптека",
              is_verified: false,
              is_active: false,
            }
          }
        />
      </PharmacyLayout>
    );
  }

  const newOrders = orders.filter((o) => o.status === "created");
  const activeOrders = orders.filter((o) =>
    ["pharmacy_confirmed", "courier_assigned", "picked_up"].includes(o.status),
  );
  const history = orders.filter((o) =>
    ["delivered", "cancelled"].includes(o.status),
  );
  const displayed =
    tab === "new" ? newOrders : tab === "active" ? activeOrders : history;
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.created_at).toDateString() === today,
  );
  const revenue = todayOrders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <PharmacyLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bold text-gray-900 text-xl">{pharmacy.name}</h1>
            <p className="text-xs text-green-600">● Открыто</p>
          </div>
          <Link
            href="/pharmacy/inventory"
            className="text-blue-600 text-sm font-medium"
          >
            Склад →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {todayOrders.length}
            </div>
            <div className="text-xs text-gray-500">Заказов сегодня</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-sm font-bold text-green-600">
              {formatPrice(revenue)}
            </div>
            <div className="text-xs text-gray-500">Выручка</div>
          </div>
          <div
            className={`rounded-xl p-3 shadow-sm ${
              newOrders.length > 0
                ? "bg-orange-50 border border-orange-100"
                : "bg-white"
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                newOrders.length > 0 ? "text-orange-600" : "text-gray-900"
              }`}
            >
              {newOrders.length}
            </div>
            <div className="text-xs text-gray-500">Новые заказы</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {orders.length}
            </div>
            <div className="text-xs text-gray-500">Всего</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {[
            { k: "new", l: "Новые", c: newOrders.length },
            { k: "active", l: "В работе", c: activeOrders.length },
            { k: "history", l: "История", c: null },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium relative transition-colors ${
                tab === t.k
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600"
              }`}
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

        {displayed.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-500 text-sm">Нет заказов</p>
          </div>
        )}

        <div className="space-y-3">
          {displayed.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between mb-2">
                <div>
                  <Link
                    href={`/pharmacy/orders/${order.id}`}
                    className="font-bold text-sm text-blue-600 hover:underline"
                  >
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleString("ru-RU")}
                  </p>
                </div>
                <span className="font-bold text-blue-600 text-sm">
                  {formatPrice(order.total_amount)}
                </span>
              </div>
              {order.items?.slice(0, 3).map((i) => (
                <div key={i.id} className="text-xs text-gray-600">
                  • {i.medicine_name} × {i.quantity}
                </div>
              ))}
              {(order.items?.length || 0) > 3 && (
                <div className="text-xs text-gray-400">
                  ещё {(order.items?.length || 0) - 3}...
                </div>
              )}
              <p className="text-xs text-gray-500 my-2">
                📍 {order.delivery_address}
              </p>
              {order.status === "created" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(order.id, "cancelled")}
                    className="flex-1 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-medium"
                  >
                    Отклонить
                  </button>
                  <button
                    onClick={() => updateStatus(order.id, "pharmacy_confirmed")}
                    className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold"
                  >
                    ✓ Подтвердить
                  </button>
                </div>
              )}
              {order.status === "pharmacy_confirmed" && (
                <div className="bg-yellow-50 rounded-xl px-3 py-2 text-xs text-yellow-700 text-center">
                  Ожидание курьера...
                </div>
              )}
              {["courier_assigned", "picked_up"].includes(order.status) && (
                <div className="bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700 text-center">
                  {ORDER_STATUS_LABELS[order.status]}
                </div>
              )}
              {order.status === "delivered" && (
                <div className="bg-green-50 rounded-xl px-3 py-2 text-xs text-green-700 text-center">
                  ✓ Доставлено
                </div>
              )}
              {order.status === "cancelled" && (
                <div className="bg-red-50 rounded-xl px-3 py-2 text-xs text-red-600 text-center">
                  Отменено
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PharmacyLayout>
  );
}
