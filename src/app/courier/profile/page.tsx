"use client";
// src/app/courier/profile/page.tsx
import { useState, useEffect } from "react";
import { CourierLayout } from "@/components/layout/CourierLayout";
import { useAuth, signOut } from "@/hooks/useAuth";
import { createClient as createAdmin } from "@supabase/supabase-js";

const VEHICLES = [
  { value: "bicycle", label: "🚲 Велосипед" },
  { value: "motorcycle", label: "🛵 Мотоцикл" },
  { value: "car", label: "🚗 Автомобиль" },
];

interface CourierData {
  vehicle_type: string;
  vehicle_number: string | null;
  is_available: boolean;
  rating: number;
  total_deliveries: number;
}

export default function CourierProfilePage() {
  const { user } = useAuth();
  const [courier, setCourier] = useState<CourierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    vehicle_type: "bicycle",
    vehicle_number: "",
  });

  useEffect(() => {
    fetch("/api/couriers/me")
      .then((r) => r.json())
      .then((d) => {
        setCourier(d.courier);
        setLoading(false);
      });
  }, []);

  const startEdit = () => {
    setForm({
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      vehicle_type: courier?.vehicle_type || "bicycle",
      vehicle_number: courier?.vehicle_number || "",
    });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/couriers/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditing(false);
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CourierLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="font-bold text-gray-900 text-xl mb-6">Мой профиль</h1>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {courier?.total_deliveries || 0}
                </div>
                <div className="text-xs text-gray-500">Доставок</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {courier?.rating || "0.0"} ⭐
                </div>
                <div className="text-xs text-gray-500">Рейтинг</div>
              </div>
            </div>

            {/* Profile */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-sm">
                  Личные данные
                </h2>
                {!editing && (
                  <button
                    onClick={startEdit}
                    className="text-blue-600 text-sm font-medium"
                  >
                    Изменить
                  </button>
                )}
              </div>

              {!editing ? (
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Имя", value: user?.full_name },
                    { label: "Телефон", value: user?.phone },
                    {
                      label: "Транспорт",
                      value:
                        VEHICLES.find((v) => v.value === courier?.vehicle_type)
                          ?.label || courier?.vehicle_type,
                    },
                    { label: "Номер", value: courier?.vehicle_number || "—" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between py-1.5 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-medium text-gray-900">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Полное имя
                    </label>
                    <input
                      value={form.full_name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, full_name: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Телефон
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">
                      Тип транспорта
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {VEHICLES.map((v) => (
                        <button
                          key={v.value}
                          type="button"
                          onClick={() =>
                            setForm((p) => ({ ...p, vehicle_type: v.value }))
                          }
                          className={`py-2 rounded-xl text-xs border transition-colors text-center ${
                            form.vehicle_type === v.value
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-600 border-gray-200"
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Номер транспорта
                    </label>
                    <input
                      value={form.vehicle_number}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          vehicle_number: e.target.value,
                        }))
                      }
                      placeholder="01 A 123 AA"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={save}
                      disabled={saving}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {saving ? "..." : "Сохранить"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={signOut}
              className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl font-medium text-sm"
            >
              Выйти из аккаунта
            </button>
          </div>
        )}
      </div>
    </CourierLayout>
  );
}
