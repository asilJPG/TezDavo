"use client";
// src/app/admin/page.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatPrice } from "@/lib/utils";

interface DailyStat {
  date: string;
  orders: number;
  revenue: number;
}

interface Stats {
  orders: {
    total: number;
    today: number;
    week: number;
    byStatus: Record<string, number>;
  };
  revenue: { total: number; today: number; week: number };
  users: { total: number; couriers: number };
  pharmacies: { active: number; pending: number };
  dailyStats: DailyStat[];
}

const STATUS_LABELS: Record<string, string> = {
  created: "Новые",
  pharmacy_confirmed: "Подтверждены",
  courier_assigned: "У курьера",
  picked_up: "В пути",
  delivered: "Доставлены",
  cancelled: "Отменены",
};

const STATUS_COLOR: Record<string, string> = {
  created: "bg-blue-100 text-blue-700",
  pharmacy_confirmed: "bg-yellow-100 text-yellow-700",
  courier_assigned: "bg-purple-100 text-purple-700",
  picked_up: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

function MiniBar({
  value,
  max,
  color = "bg-blue-500",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div
        className={`${color} h-1.5 rounded-full transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "all">("today");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      });
  }, []);

  const maxOrders = stats
    ? Math.max(...stats.dailyStats.map((d) => d.orders), 1)
    : 1;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-bold text-gray-900 text-xl">Админ панель</h1>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { k: "today", l: "Сегодня" },
              { k: "week", l: "Неделя" },
              { k: "all", l: "Всё" },
            ].map((p) => (
              <button
                key={p.k}
                onClick={() => setPeriod(p.k as typeof period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p.k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                {p.l}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {!loading && stats && (
          <>
            {/* Ключевые метрики */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {period === "today"
                    ? stats.orders.today
                    : period === "week"
                      ? stats.orders.week
                      : stats.orders.total}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Заказов</div>
                {period !== "all" && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    Всего: {stats.orders.total}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-lg font-bold text-green-600">
                  {formatPrice(
                    period === "today"
                      ? stats.revenue.today
                      : period === "week"
                        ? stats.revenue.week
                        : stats.revenue.total,
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Выручка</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.users.total}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Пользователей
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Курьеров: {stats.users.couriers}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-amber-600">
                    {stats.pharmacies.active}
                  </div>
                  {stats.pharmacies.pending > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                      +{stats.pharmacies.pending}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Аптек активных
                </div>
                {stats.pharmacies.pending > 0 && (
                  <Link
                    href="/admin/pharmacies"
                    className="text-xs text-red-600 font-medium mt-0.5 block"
                  >
                    {stats.pharmacies.pending} на модерации →
                  </Link>
                )}
              </div>
            </div>

            {/* График заказов за 7 дней */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">
                Заказы за 7 дней
              </h2>
              <div className="flex items-end gap-2 h-24">
                {stats.dailyStats.map((day, i) => {
                  const pct =
                    maxOrders > 0 ? (day.orders / maxOrders) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs text-gray-500 font-medium">
                        {day.orders || ""}
                      </span>
                      <div
                        className="w-full bg-gray-100 rounded-t-lg relative"
                        style={{ height: "64px" }}
                      >
                        <div
                          className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 truncate w-full text-center">
                        {day.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Статусы заказов */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">
                Статусы заказов
              </h2>
              <div className="space-y-2">
                {Object.entries(stats.orders.byStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium w-32 text-center ${STATUS_COLOR[status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUS_LABELS[status] || status}
                      </span>
                      <div className="flex-1">
                        <MiniBar
                          value={count}
                          max={stats.orders.total}
                          color={
                            status === "delivered"
                              ? "bg-green-500"
                              : status === "cancelled"
                                ? "bg-red-400"
                                : "bg-blue-500"
                          }
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Навигация */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {[
                {
                  href: "/admin/pharmacies",
                  icon: "🏪",
                  label: "Аптеки",
                  desc: `${stats.pharmacies.active} активных, ${stats.pharmacies.pending} на модерации`,
                  badge: stats.pharmacies.pending,
                },
                {
                  href: "/admin/users",
                  icon: "👥",
                  label: "Пользователи",
                  desc: `${stats.users.total} всего, ${stats.users.couriers} курьеров`,
                  badge: 0,
                },
                {
                  href: "/admin/orders",
                  icon: "📦",
                  label: "Все заказы",
                  desc: `${stats.orders.total} заказов`,
                  badge: stats.orders.byStatus["created"] || 0,
                },
              ].map((item, i, arr) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <span className="text-xl w-8">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                  <span className="text-gray-300">›</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
