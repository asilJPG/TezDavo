"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

interface Inventory {
  id: string;
  price: number;
  quantity: number;
  requires_prescription: boolean;
  medicine: {
    id: string;
    name: string;
    generic_name?: string;
    category: string;
    dosage_strength?: string;
    requires_prescription: boolean;
  };
}
interface Pharmacy {
  id: string;
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  working_hours: { mon_fri: string; sat_sun: string };
  is_verified: boolean;
  rating: number;
  review_count: number;
}

export default function PharmacyPublicPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem, pharmacyId } = useCart();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pharmacies/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setPharmacy(d.pharmacy);
        setInventory(d.inventory || []);
        setLoading(false);
      });
  }, [id]);

  const handleAdd = (item: Inventory) => {
    if (pharmacyId && pharmacyId !== id) {
      if (!confirm("В корзине товары из другой аптеки. Очистить?")) return;
    }
    if (!pharmacy) return;
    addItem({
      inventory_id: item.id,
      medicine_id: item.medicine.id,
      pharmacy_id: id,
      pharmacy_name: pharmacy.name,
      medicine_name: item.medicine.name,
      price: item.price,
      requires_prescription: item.requires_prescription,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const filtered = inventory.filter((i) =>
    i.medicine.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <AppLayout>
        <div className="p-8 max-w-2xl mx-auto space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </AppLayout>
    );
  if (!pharmacy)
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Аптека не найдена
        </div>
      </AppLayout>
    );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/search" className="text-gray-500 text-xl">
            ←
          </Link>
          <h1 className="font-bold text-gray-900 text-xl flex-1 truncate">
            {pharmacy.name}
          </h1>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex gap-4 items-start">
            <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
              🏪
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-gray-900 text-lg">
                  {pharmacy.name}
                </h2>
                {pharmacy.is_verified && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    ✓ Верифицировано
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">
                📍 {pharmacy.address}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-amber-500 text-sm">
                  ⭐ {pharmacy.rating.toFixed(1)}
                </span>
                <span className="text-gray-400 text-xs">
                  ({pharmacy.review_count} отзывов)
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Пн–Пт</p>
              <p className="font-medium text-gray-900 text-sm">
                {pharmacy.working_hours.mon_fri}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Сб–Вс</p>
              <p className="font-medium text-gray-900 text-sm">
                {pharmacy.working_hours.sat_sun}
              </p>
            </div>
          </div>
          <a
            href={`tel:${pharmacy.phone}`}
            className="flex items-center gap-2 mt-3 text-blue-600 text-sm font-medium"
          >
            📞 {pharmacy.phone}
          </a>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по аптеке..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 mb-4"
        />
        <p className="text-xs text-gray-500 mb-3">
          {filtered.length} позиций в наличии
        </p>

        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💊</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/medicine/${item.medicine.id}`}>
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {item.medicine.name}
                  </p>
                </Link>
                {item.medicine.generic_name && (
                  <p className="text-xs text-gray-400 truncate">
                    {item.medicine.generic_name}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-blue-600 text-sm">
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.quantity} шт.
                  </span>
                  {item.medicine.requires_prescription && (
                    <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">
                      Рецепт
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleAdd(item)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${addedId === item.id ? "bg-green-500 text-white" : "bg-blue-600 text-white"}`}
              >
                {addedId === item.id ? "✓" : "+"}
              </button>
            </div>
          ))}
          {filtered.length === 0 && search && (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">Ничего не найдено</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
