"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  is_verified: boolean;
  working_hours: { mon_fri: string; sat_sun: string };
}
interface PriceRow {
  id: string;
  price: number;
  quantity: number;
  pharmacy: Pharmacy;
}
interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  category: string;
  manufacturer?: string;
  dosage_form?: string;
  dosage_strength?: string;
  description?: string;
  instructions?: string;
  side_effects?: string;
  contraindications?: string;
  requires_prescription: boolean;
}

export default function MedicinePage() {
  const { id } = useParams<{ id: string }>();
  const { addItem, pharmacyId } = useCart();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"prices" | "info">("prices");
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/medicines/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setMedicine(d.medicine);
        setPrices(d.prices || []);
        setLoading(false);
      });
  }, [id]);

  const handleAdd = (row: PriceRow) => {
    if (pharmacyId && pharmacyId !== row.pharmacy.id) {
      if (!confirm("В корзине товары из другой аптеки. Очистить корзину?"))
        return;
    }
    if (!medicine) return;
    addItem({
      inventory_id: row.id,
      medicine_id: id,
      pharmacy_id: row.pharmacy.id,
      pharmacy_name: row.pharmacy.name,
      medicine_name: medicine.name,
      price: row.price,
    });
    setAddedId(row.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  if (loading)
    return (
      <AppLayout>
        <div className="p-8 space-y-4 max-w-2xl mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </AppLayout>
    );
  if (!medicine)
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Лекарство не найдено
        </div>
      </AppLayout>
    );

  const minPrice = prices.length
    ? Math.min(...prices.map((p) => p.price))
    : null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back + title */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/search" className="text-gray-500 text-xl">
            ←
          </Link>
          <h1 className="font-bold text-gray-900 text-lg flex-1 truncate">
            {medicine.name}
          </h1>
        </div>

        {/* Medicine card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-4xl">💊</span>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900 text-xl">
                {medicine.name}
              </h2>
              {medicine.generic_name && (
                <p className="text-gray-500 text-sm">{medicine.generic_name}</p>
              )}
              {medicine.manufacturer && (
                <p className="text-gray-400 text-xs">{medicine.manufacturer}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {medicine.category}
                </span>
                {medicine.dosage_strength && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {medicine.dosage_strength}
                  </span>
                )}
                {medicine.requires_prescription && (
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                    🔒 Рецепт
                  </span>
                )}
              </div>
              {minPrice && (
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-gray-400 text-sm">от</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(minPrice)}
                  </span>
                  <span className="text-gray-400 text-xs ml-1">
                    в {prices.length} аптеках
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["prices", "info"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 shadow-sm"
              }`}
            >
              {t === "prices" ? `Цены (${prices.length})` : "Инструкция"}
            </button>
          ))}
        </div>

        {/* Prices */}
        {tab === "prices" && (
          <div className="space-y-3">
            {prices.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl">
                <div className="text-4xl mb-2">🏪</div>
                <p className="text-gray-500">Нет в наличии</p>
              </div>
            )}
            {prices.map((row, i) => (
              <div key={row.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">
                        {row.pharmacy.name}
                      </span>
                      {row.pharmacy.is_verified && (
                        <span className="text-blue-500 text-xs">✓</span>
                      )}
                      {i === 0 && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                          Лучшая цена
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      📍 {row.pharmacy.address}
                    </p>
                    <p className="text-xs text-gray-400">
                      ⏰ {row.pharmacy.working_hours?.mon_fri}
                    </p>
                    <p className="text-xs text-gray-400">
                      В наличии: {row.quantity} шт.
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold text-blue-600 text-xl">
                      {row.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">сум</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/pharmacy/${row.pharmacy.id}`}
                    className="flex-1 text-center py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
                  >
                    Аптека
                  </Link>
                  <button
                    onClick={() => handleAdd(row)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      addedId === row.id
                        ? "bg-green-500 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {addedId === row.id ? "✓ Добавлено" : "В корзину"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        {tab === "info" && (
          <div className="space-y-3">
            {[
              { label: "Описание", content: medicine.description },
              { label: "Способ применения", content: medicine.instructions },
              { label: "⚠️ Побочные эффекты", content: medicine.side_effects },
            ]
              .filter((s) => s.content)
              .map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {s.label}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {s.content}
                  </p>
                </div>
              ))}
            {medicine.contraindications && (
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-2 text-sm">
                  🚫 Противопоказания
                </h3>
                <p className="text-red-700 text-sm leading-relaxed">
                  {medicine.contraindications}
                </p>
              </div>
            )}
            <Link
              href={`/ai-chat?medicine=${encodeURIComponent(medicine.name)}`}
              className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4"
            >
              <span className="text-2xl">🤖</span>
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  Спросить AI помощника
                </div>
                <div className="text-xs text-gray-500">
                  Как принимать {medicine.name}?
                </div>
              </div>
              <span className="text-blue-500 ml-auto">→</span>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
