"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PharmacyLayout } from "@/components/layout/PharmacyLayout";
import { formatPrice } from "@/lib/utils";

interface Item {
  id: string;
  quantity: number;
  price: number;
  in_stock: boolean;
  medicine: {
    id: string;
    name: string;
    category: string;
    dosage_strength?: string;
  };
}

export default function PharmacyInventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, quantity: 0 });

  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    setLoading(false);
  }; // requires pharmacy-specific API

  const filtered = items.filter((i) =>
    i.medicine.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PharmacyLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/pharmacy/dashboard" className="text-gray-500 text-xl">
            ←
          </Link>
          <h1 className="font-bold text-gray-900 text-xl flex-1">Склад</h1>
          <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl font-medium">
            + Добавить
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по складу..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 mb-4"
        />
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xl font-bold">{items.length}</p>
            <p className="text-xs text-gray-500">Позиций</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xl font-bold text-green-600">
              {items.filter((i) => i.in_stock).length}
            </p>
            <p className="text-xs text-gray-500">В наличии</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xl font-bold text-red-500">
              {items.filter((i) => !i.in_stock).length}
            </p>
            <p className="text-xs text-gray-500">Нет</p>
          </div>
        </div>
        {loading && (
          <div className="text-center py-10 text-gray-400">Загрузка...</div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-gray-500 mb-2">Склад пуст</p>
            <button className="text-blue-600 text-sm font-medium">
              Добавить первое лекарство
            </button>
          </div>
        )}
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
              {editing === item.id ? (
                <div className="space-y-3">
                  <p className="font-semibold text-sm">{item.medicine.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Цена
                      </label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            price: Number(e.target.value),
                          }))
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Кол-во
                      </label>
                      <input
                        type="number"
                        value={editForm.quantity}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            quantity: Number(e.target.value),
                          }))
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(null)}
                      className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm"
                    >
                      Отмена
                    </button>
                    <button className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
                      Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {item.medicine.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.medicine.category}
                      {item.medicine.dosage_strength
                        ? ` · ${item.medicine.dosage_strength}`
                        : ""}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-blue-600 font-semibold text-sm">
                        {formatPrice(item.price)}
                      </span>
                      <span
                        className={`text-xs ${
                          item.in_stock ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {item.in_stock ? `✓ ${item.quantity} шт.` : "✗ Нет"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditing(item.id);
                      setEditForm({
                        price: item.price,
                        quantity: item.quantity,
                      });
                    }}
                    className="text-blue-600 text-sm font-medium"
                  >
                    Изменить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PharmacyLayout>
  );
}
