"use client";
// src/app/pharmacy/profile/page.tsx
import { useState, useEffect } from "react";
import { PharmacyLayout } from "@/components/layout/PharmacyLayout";
import { useAuth, signOut } from "@/hooks/useAuth";
import { ReviewsSection } from "@/components/pharmacy/ReviewsSection";

interface PharmacyData {
  id: string;
  name: string;
  address: string;
  phone: string;
  license_number: string;
  is_verified: boolean;
  is_active: boolean;
  working_hours: { mon_fri: string; sat_sun: string };
  rating: number;
  review_count: number;
}

export default function PharmacyProfilePage() {
  const { user } = useAuth();
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    mon_fri: "",
    sat_sun: "",
  });

  useEffect(() => {
    fetch("/api/pharmacies/my")
      .then((r) => r.json())
      .then((d) => {
        setPharmacy(d.pharmacy);
        setLoading(false);
      });
  }, []);

  const startEdit = () => {
    if (!pharmacy) return;
    setForm({
      name: pharmacy.name,
      phone: pharmacy.phone,
      mon_fri: pharmacy.working_hours?.mon_fri || "",
      sat_sun: pharmacy.working_hours?.sat_sun || "",
    });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/pharmacies/my", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          working_hours: { mon_fri: form.mon_fri, sat_sun: form.sat_sun },
        }),
      });
      setEditing(false);
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <PharmacyLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="font-bold text-gray-900 text-xl mb-6">Профиль аптеки</h1>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && pharmacy && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                🏪
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{pharmacy.name}</p>
                <p className="text-sm text-gray-500">{pharmacy.address}</p>
                <div className="flex gap-2 mt-1">
                  {pharmacy.is_verified ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      ✓ Верифицировано
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      ⏳ На модерации
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-sm">
                  Информация
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
                    { label: "Телефон", value: pharmacy.phone },
                    { label: "Лицензия", value: pharmacy.license_number },
                    { label: "Пн-Пт", value: pharmacy.working_hours?.mon_fri },
                    { label: "Сб-Вс", value: pharmacy.working_hours?.sat_sun },
                    {
                      label: "Рейтинг",
                      value: `${pharmacy.rating} ⭐ (${pharmacy.review_count} отзывов)`,
                    },
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
                  {[
                    { key: "name", label: "Название аптеки" },
                    { key: "phone", label: "Телефон" },
                    {
                      key: "mon_fri",
                      label: "Часы работы Пн-Пт (например: 08:00-22:00)",
                    },
                    {
                      key: "sat_sun",
                      label: "Часы работы Сб-Вс (например: 09:00-20:00)",
                    },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-xs text-gray-500 mb-1 block">
                        {f.label}
                      </label>
                      <input
                        value={(form as any)[f.key]}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, [f.key]: e.target.value }))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                  ))}
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

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2 text-sm">
              <h2 className="font-semibold text-gray-900 mb-2">Аккаунт</h2>
              <div className="flex justify-between">
                <span className="text-gray-500">Владелец</span>
                <span className="font-medium">{user?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{user?.email}</span>
              </div>
            </div>
            {pharmacy && <ReviewsSection pharmacyId={pharmacy.id} />}
            <button
              onClick={signOut}
              className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl font-medium text-sm"
            >
              Выйти из аккаунта
            </button>
          </div>
        )}
      </div>
    </PharmacyLayout>
  );
}
