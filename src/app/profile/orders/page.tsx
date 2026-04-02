"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { OrderCard } from "@/components/order/OrderCard";
import type { Order } from "@/types";

const ACTIVE_STATUSES = [
  "created",
  "pharmacy_confirmed",
  "courier_assigned",
  "picked_up",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "history">("active");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setLoading(false);
      });
  }, []);

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const history = orders.filter((o) =>
    ["delivered", "cancelled"].includes(o.status),
  );
  const displayed = tab === "active" ? active : history;

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="text-gray-500 text-xl">
            ←
          </Link>
          <h1 className="font-bold text-gray-900 text-xl flex-1">Мои заказы</h1>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("active")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium relative transition-colors ${
              tab === "active"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            Активные
            {active.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {active.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === "history"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            История
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-gray-500">
              {tab === "active" ? "Нет активных заказов" : "История пуста"}
            </p>
            {tab === "active" && (
              <Link
                href="/search"
                className="text-blue-600 text-sm mt-2 block font-medium"
              >
                Найти лекарства →
              </Link>
            )}
          </div>
        )}

        <div className="space-y-3">
          {displayed.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
