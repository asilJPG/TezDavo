"use client";
// src/app/pharmacy/profile/page.tsx
import { useState, useEffect } from "react";
import { PharmacyLayout } from "@/components/layout/PharmacyLayout";
import { useAuth, signOut } from "@/hooks/useAuth";

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

  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        const res = await fetch("/api/pharmacies/my");
        const data = await res.json();
        setPharmacy(data.pharmacy);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchPharmacy();
  }, [user]);

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
            {/* Status */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                🏪
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{pharmacy.name}</p>
                <p className="text-sm text-gray-500">{pharmacy.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  {pharmacy.is_verified ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      ✓ Верифицировано
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      ⏳ Ожидает проверки
                    </span>
                  )}
                  {pharmacy.is_active ? (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      ● Активно
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Неактивно
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <h2 className="font-semibold text-gray-900 text-sm">
                Информация
              </h2>
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
                  className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Account */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <h2 className="font-semibold text-gray-900 text-sm">Аккаунт</h2>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Владелец</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.full_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={signOut}
              className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 transition-colors"
            >
              Выйти из аккаунта
            </button>
          </div>
        )}

        {!loading && !pharmacy && (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="text-4xl mb-3">🏪</div>
            <p className="text-gray-500 text-sm">Профиль аптеки не найден</p>
            <p className="text-gray-400 text-xs mt-1">Обратитесь в поддержку</p>
          </div>
        )}
      </div>
    </PharmacyLayout>
  );
}
