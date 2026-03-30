"use client";
// src/app/admin/pharmacies/page.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  license_number: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  user_id: string;
  owner?: { full_name: string; email: string; phone: string };
}

export default function AdminPharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "active" | "all">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pharmacies");
      const data = await res.json();
      setPharmacies(data.pharmacies || []);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (id: string, verified: boolean, active: boolean) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/pharmacies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: verified, is_active: active }),
      });
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const pending = pharmacies.filter((p) => !p.is_verified);
  const active = pharmacies.filter((p) => p.is_verified && p.is_active);
  const displayed =
    tab === "pending" ? pending : tab === "active" ? active : pharmacies;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 text-xl">
            ←
          </Link>
          <h1 className="font-bold text-gray-900 text-xl flex-1">Аптеки</h1>
          <span className="text-xs text-gray-400">
            {pharmacies.length} всего
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { k: "pending", l: "На модерации", c: pending.length },
            { k: "active", l: "Активные", c: active.length },
            { k: "all", l: "Все", c: null },
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

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-4xl mb-2">🏪</div>
            <p className="text-gray-500 text-sm">
              {tab === "pending" ? "Нет аптек на модерации" : "Нет аптек"}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {displayed.map((pharmacy) => (
            <div
              key={pharmacy.id}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">
                      {pharmacy.name}
                    </span>
                    {pharmacy.is_verified ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        ✓ Верифицировано
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        ⏳ На модерации
                      </span>
                    )}
                    {pharmacy.is_active ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        ● Активно
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Неактивно
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    📍 {pharmacy.address}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-400">Лицензия</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {pharmacy.license_number}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-400">Телефон</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {pharmacy.phone}
                  </p>
                </div>
                {pharmacy.owner && (
                  <>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-400">Владелец</span>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {pharmacy.owner.full_name}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-400">Email</span>
                      <p className="font-semibold text-gray-900 mt-0.5 truncate">
                        {pharmacy.owner.email}
                      </p>
                    </div>
                  </>
                )}
                <div className="bg-gray-50 rounded-lg px-3 py-2 col-span-2">
                  <span className="text-gray-400">Дата регистрации</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {new Date(pharmacy.created_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!pharmacy.is_verified ? (
                  <>
                    <button
                      onClick={() => verify(pharmacy.id, false, false)}
                      disabled={actionLoading === pharmacy.id}
                      className="flex-1 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                    >
                      ✕ Отклонить
                    </button>
                    <button
                      onClick={() => verify(pharmacy.id, true, true)}
                      disabled={actionLoading === pharmacy.id}
                      className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === pharmacy.id
                        ? "..."
                        : "✓ Верифицировать"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() =>
                      verify(
                        pharmacy.id,
                        pharmacy.is_verified,
                        !pharmacy.is_active
                      )
                    }
                    disabled={actionLoading === pharmacy.id}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium disabled:opacity-50 ${
                      pharmacy.is_active
                        ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {actionLoading === pharmacy.id
                      ? "..."
                      : pharmacy.is_active
                      ? "Деактивировать"
                      : "Активировать"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
