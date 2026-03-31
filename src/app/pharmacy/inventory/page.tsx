"use client";
import { useState, useEffect } from "react";
import { PharmacyLayout } from "@/components/layout/PharmacyLayout";
import { formatPrice } from "@/lib/utils";

interface InventoryItem {
  id: string;
  quantity: number;
  price: number;
  medicine: {
    id: string;
    name: string;
    category: string;
    dosage_strength?: string;
  };
}

interface Medicine {
  id: string;
  name: string;
  category: string;
  dosage_strength?: string;
}

type ModalStep = "search" | "fill" | "create";

export default function PharmacyInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [step, setStep] = useState<ModalStep>("search");
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, quantity: 0 });
  const [saving, setSaving] = useState(false);

  // Search
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [addForm, setAddForm] = useState({ price: "", quantity: "" });

  // Create new medicine
  const [newMed, setNewMed] = useState({
    name: "",
    category: "Обезболивающие",
    dosage_strength: "",
    dosage_form: "tablet",
  });

  const CATEGORIES = [
    "Обезболивающие",
    "Антибиотики",
    "Антигистаминные",
    "Витамины",
    "Желудочно-кишечные",
    "Сердечные",
    "Спазмолитики",
    "Диабет",
    "Другое",
  ];

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pharmacy/inventory");
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  const searchMedicines = async (q: string) => {
    setMedSearch(q);
    if (!q.trim()) {
      setMedicines([]);
      return;
    }
    const res = await fetch(
      `/api/medicines?q=${encodeURIComponent(q)}&limit=8`
    );
    const data = await res.json();
    setMedicines(data.medicines || []);
  };

  const selectMedicine = (med: Medicine) => {
    setSelectedMed(med);
    setStep("fill");
  };

  const addToInventory = async () => {
    if (!selectedMed || !addForm.price || !addForm.quantity) return;
    setSaving(true);
    try {
      await fetch("/api/pharmacy/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicine_id: selectedMed.id,
          price: Number(addForm.price),
          quantity: Number(addForm.quantity),
        }),
      });
      closeModal();
      loadInventory();
    } finally {
      setSaving(false);
    }
  };

  const createAndAdd = async () => {
    if (!newMed.name || !addForm.price || !addForm.quantity) return;
    setSaving(true);
    try {
      // Создаём новое лекарство
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMed),
      });
      const data = await res.json();
      if (!data.medicine) {
        setSaving(false);
        return;
      }

      // Добавляем на склад
      await fetch("/api/pharmacy/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicine_id: data.medicine.id,
          price: Number(addForm.price),
          quantity: Number(addForm.quantity),
        }),
      });
      closeModal();
      loadInventory();
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/pharmacy/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditing(null);
      loadInventory();
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowAdd(false);
    setStep("search");
    setSelectedMed(null);
    setMedSearch("");
    setMedicines([]);
    setAddForm({ price: "", quantity: "" });
    setNewMed({
      name: "",
      category: "Обезболивающие",
      dosage_strength: "",
      dosage_form: "tablet",
    });
  };

  const filtered = items.filter((i) =>
    i.medicine.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PharmacyLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-bold text-gray-900 text-xl flex-1">Склад</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl font-medium"
          >
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
              {items.filter((i) => i.quantity > 0).length}
            </p>
            <p className="text-xs text-gray-500">В наличии</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xl font-bold text-red-500">
              {items.filter((i) => i.quantity === 0).length}
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
            <p className="text-gray-500 mb-3">Склад пуст</p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-blue-600 text-sm font-medium"
            >
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
                        Цена (сум)
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
                        Количество
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
                    <button
                      onClick={() => saveEdit(item.id)}
                      disabled={saving}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {saving ? "..." : "Сохранить"}
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
                          item.quantity > 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {item.quantity > 0
                          ? `✓ ${item.quantity} шт.`
                          : "✗ Нет в наличии"}
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

      {/* Modal — centered */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                {step !== "search" && (
                  <button
                    onClick={() => setStep("search")}
                    className="text-gray-400 text-lg mr-1"
                  >
                    ←
                  </button>
                )}
                <h2 className="font-bold text-gray-900">
                  {step === "search" && "Добавить лекарство"}
                  {step === "fill" && selectedMed?.name}
                  {step === "create" && "Новое лекарство"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              {/* Step 1: Search */}
              {step === "search" && (
                <>
                  <input
                    value={medSearch}
                    onChange={(e) => searchMedicines(e.target.value)}
                    placeholder="Введите название лекарства..."
                    autoFocus
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 mb-3"
                  />

                  <div className="space-y-2">
                    {medicines.map((med) => (
                      <button
                        key={med.id}
                        onClick={() => selectMedicine(med)}
                        className="w-full text-left bg-gray-50 hover:bg-blue-50 rounded-xl px-4 py-3 transition-colors"
                      >
                        <p className="font-medium text-gray-900 text-sm">
                          {med.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {med.category}
                          {med.dosage_strength
                            ? ` · ${med.dosage_strength}`
                            : ""}
                        </p>
                      </button>
                    ))}

                    {/* Not found — offer to create */}
                    {medSearch.trim().length > 1 && medicines.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm mb-3">
                          «{medSearch}» не найдено в базе
                        </p>
                        <button
                          onClick={() => {
                            setNewMed((p) => ({ ...p, name: medSearch }));
                            setStep("create");
                          }}
                          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
                        >
                          + Добавить «{medSearch}» вручную
                        </button>
                      </div>
                    )}

                    {!medSearch && (
                      <p className="text-center text-gray-400 text-sm py-4">
                        Начните вводить название
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Fill price/qty for existing medicine */}
              {step === "fill" && selectedMed && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl px-4 py-3">
                    <p className="font-semibold text-gray-900 text-sm">
                      {selectedMed.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedMed.category}
                      {selectedMed.dosage_strength
                        ? ` · ${selectedMed.dosage_strength}`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Цена (сум) *
                    </label>
                    <input
                      type="number"
                      value={addForm.price}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, price: e.target.value }))
                      }
                      placeholder="например: 12000"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Количество (шт.) *
                    </label>
                    <input
                      type="number"
                      value={addForm.quantity}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, quantity: e.target.value }))
                      }
                      placeholder="например: 50"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <button
                    onClick={addToInventory}
                    disabled={saving || !addForm.price || !addForm.quantity}
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50"
                  >
                    {saving ? "Добавляем..." : "Добавить на склад"}
                  </button>
                </div>
              )}

              {/* Step 3: Create new medicine */}
              {step === "create" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название *
                    </label>
                    <input
                      value={newMed.name}
                      onChange={(e) =>
                        setNewMed((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Категория *
                    </label>
                    <select
                      value={newMed.category}
                      onChange={(e) =>
                        setNewMed((p) => ({ ...p, category: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дозировка
                    </label>
                    <input
                      value={newMed.dosage_strength}
                      onChange={(e) =>
                        setNewMed((p) => ({
                          ...p,
                          dosage_strength: e.target.value,
                        }))
                      }
                      placeholder="например: 500мг"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-500 mb-3">
                      Цена и количество
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Цена (сум) *
                        </label>
                        <input
                          type="number"
                          value={addForm.price}
                          onChange={(e) =>
                            setAddForm((p) => ({ ...p, price: e.target.value }))
                          }
                          placeholder="12000"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Кол-во (шт.) *
                        </label>
                        <input
                          type="number"
                          value={addForm.quantity}
                          onChange={(e) =>
                            setAddForm((p) => ({
                              ...p,
                              quantity: e.target.value,
                            }))
                          }
                          placeholder="50"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={createAndAdd}
                    disabled={
                      saving ||
                      !newMed.name ||
                      !addForm.price ||
                      !addForm.quantity
                    }
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50"
                  >
                    {saving ? "Создаём..." : "Создать и добавить на склад"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PharmacyLayout>
  );
}
