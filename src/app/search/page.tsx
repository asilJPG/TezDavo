"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatPrice } from "@/lib/utils";

interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  category: string;
  manufacturer?: string;
  requires_prescription: boolean;
  min_price?: number;
  pharmacy_count?: number;
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  working_hours: { mon_fri: string; sat_sun: string };
}

const CATEGORIES = [
  "Все",
  "Обезболивающие",
  "Антибиотики",
  "Антигистаминные",
  "Витамины",
  "Желудочно-кишечные",
  "Сердечные",
  "Спазмолитики",
  "Противовирусные",
];

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(
    searchParams.get("category") || "Все",
  );
  const [tab, setTab] = useState<"medicines" | "pharmacies">("medicines");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const doSearch = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (cat && cat !== "Все") p.set("category", cat);
      const data = await fetch(`/api/medicines?${p}`).then((r) => r.json());
      setMedicines(data.medicines || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPharmacies = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      const data = await fetch(
        `/api/pharmacies?q=${encodeURIComponent(q)}`,
      ).then((r) => r.json());
      setPharmacies(data.pharmacies || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "medicines") doSearch(query, category);
    else searchPharmacies(query);
  }, [query, category, tab, doSearch, searchPharmacies]);

  const Skeleton = () => (
    <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse flex gap-3">
      <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Search bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            tab === "medicines"
              ? doSearch(query, category)
              : searchPharmacies(query);
          }}
          className="flex gap-2 mb-4"
        >
          <Link
            href="/"
            className="lg:hidden flex items-center justify-center w-10 h-11 text-gray-500 text-xl flex-shrink-0"
          >
            ←
          </Link>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === "medicines" ? "Поиск лекарств..." : "Поиск аптек..."
            }
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-gray-400 text-xl px-1"
            >
              ×
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap"
          >
            Найти
          </button>
        </form>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("medicines")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "medicines" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            💊 Лекарства
          </button>
          <button
            onClick={() => setTab("pharmacies")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "pharmacies" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            🏪 Аптеки
          </button>
        </div>

        {/* Category filter — only for medicines */}
        {tab === "medicines" && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Result count */}
        {!loading && tab === "medicines" && total > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Найдено: {total} лекарств
          </p>
        )}
        {!loading && tab === "pharmacies" && pharmacies.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Найдено: {pharmacies.length} аптек
          </p>
        )}

        {/* Results */}
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)
            : tab === "medicines"
              ? medicines.map((med) => (
                  <Link
                    key={med.id}
                    href={`/medicine/${med.id}`}
                    className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">💊</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {med.name}
                      </p>
                      {med.generic_name && (
                        <p className="text-xs text-gray-400 truncate">
                          {med.generic_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {med.category}
                        {med.manufacturer ? ` · ${med.manufacturer}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {med.requires_prescription && (
                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                            Рецепт
                          </span>
                        )}
                        {med.min_price ? (
                          <span className="text-blue-600 font-semibold text-sm">
                            от {formatPrice(med.min_price)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Нет в аптеках
                          </span>
                        )}
                        {med.pharmacy_count ? (
                          <span className="text-gray-400 text-xs">
                            · {med.pharmacy_count} аптек
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-gray-300 text-lg flex-shrink-0">
                      ›
                    </span>
                  </Link>
                ))
              : pharmacies.map((pharmacy) => (
                  <Link
                    key={pharmacy.id}
                    href={`/pharmacy/${pharmacy.id}`}
                    className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🏪</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {pharmacy.name}
                        </p>
                        {pharmacy.is_verified && (
                          <span className="text-blue-500 text-xs">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        📍 {pharmacy.address}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-amber-500">
                          ⭐ {pharmacy.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({pharmacy.review_count} отзывов)
                        </span>
                        <span className="text-xs text-gray-400">
                          ⏰ {pharmacy.working_hours?.mon_fri}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-300 text-lg flex-shrink-0">
                      ›
                    </span>
                  </Link>
                ))}
        </div>

        {!loading && tab === "medicines" && medicines.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">Ничего не найдено</p>
            <p className="text-gray-400 text-sm mt-1">
              Попробуйте другое название
            </p>
          </div>
        )}

        {!loading && tab === "pharmacies" && pharmacies.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🏪</div>
            <p className="text-gray-500 font-medium">Аптеки не найдены</p>
            <p className="text-gray-400 text-sm mt-1">
              Попробуйте другое название
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
