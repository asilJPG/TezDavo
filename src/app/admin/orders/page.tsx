"use client";
// src/app/admin/orders/page.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/types";
import type { OrderStatus } from "@/types";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  pharmacy: { name: string } | null;
  items: { id: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  created: "bg-blue-100 text-blue-700",
  pharmacy_confirmed: "bg-yellow-100 text-yellow-700",
  courier_assigned: "bg-purple-100 text-purple-700",
  picked_up: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setLoading(false);
      });
  }, []);

  const statuses = [
    "all",
    "created",
    "pharmacy_confirmed",
    "courier_assigned",
    "picked_up",
    "delivered",
    "cancelled",
  ];

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchSearch =
      !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.delivery_address.toLowerCase().includes(search.toLowerCase()) ||
      (o.pharmacy?.name || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 text-xl">
            ←
          </Link>
          <h1 className="font-bold text-gray-900 text-xl flex-1">Все заказы</h1>
          <span className="text-xs text-gray-400">{orders.length} всего</span>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по номеру, адресу, аптеке..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 mb-3"
        />

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {s === "all"
                ? `Все (${orders.length})`
                : `${ORDER_STATUS_LABELS[s as OrderStatus]} (${counts[s] || 0})`}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-gray-500 text-sm">Нет заказов</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-bold text-gray-900 text-sm">
                    {order.order_number}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600 text-sm">
                    {formatPrice(order.total_amount)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.status] || ""}`}
                  >
                    {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                  </span>
                </div>
              </div>
              {order.pharmacy && (
                <p className="text-xs text-gray-600 mb-1">
                  🏪 {order.pharmacy.name}
                </p>
              )}
              <p className="text-xs text-gray-500 truncate">
                📍 {order.delivery_address}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
