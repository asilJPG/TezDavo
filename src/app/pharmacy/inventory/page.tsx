'use client'
// src/app/pharmacy/inventory/page.tsx — Управление складом аптеки
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface InventoryItem {
  id: string
  quantity: number
  price: number
  in_stock: boolean
  medicine: {
    id: string
    name: string
    generic_name?: string
    category: string
    dosage_strength?: string
  }
}

export default function PharmacyInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ price: 0, quantity: 0 })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    // В реальном приложении - /api/pharmacies/me/inventory
    setLoading(false)
  }

  const filtered = items.filter(item =>
    item.medicine.name.toLowerCase().includes(search.toLowerCase())
  )

  const saveEdit = async (inventoryId: string) => {
    await fetch(`/api/pharmacies/inventory/${inventoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditing(null)
    fetchInventory()
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/pharmacy/dashboard" className="text-gray-600 text-xl">←</Link>
        <h1 className="font-semibold text-gray-900 flex-1">Склад</h1>
        <button className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-xl font-medium">
          + Добавить
        </button>
      </header>

      <div className="px-4 pt-4">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по складу..."
          className="input mb-4"
        />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-900">{items.length}</p>
            <p className="text-xs text-gray-500">Позиций</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xl font-bold text-green-600">{items.filter(i => i.in_stock).length}</p>
            <p className="text-xs text-gray-500">В наличии</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xl font-bold text-red-500">{items.filter(i => !i.in_stock).length}</p>
            <p className="text-xs text-gray-500">Нет в наличии</p>
          </div>
        </div>

        {loading && <p className="text-center text-gray-400 py-10">Загрузка...</p>}

        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-gray-500 mb-2">Склад пуст</p>
            <button className="text-blue-600 text-sm font-medium">Добавить первое лекарство</button>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
              {editing === item.id ? (
                <div className="space-y-3">
                  <p className="font-semibold text-gray-900 text-sm">{item.medicine.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Цена (сум)</label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={e => setEditForm(p => ({ ...p, price: Number(e.target.value) }))}
                        className="input text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Количество</label>
                      <input
                        type="number"
                        value={editForm.quantity}
                        onChange={e => setEditForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                        className="input text-sm py-2"
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
                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.medicine.name}</p>
                    <p className="text-xs text-gray-400">{item.medicine.category} · {item.medicine.dosage_strength}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-blue-600 font-semibold text-sm">{formatPrice(item.price)}</span>
                      <span className={`text-xs ${item.in_stock ? 'text-green-600' : 'text-red-500'}`}>
                        {item.in_stock ? `✓ ${item.quantity} шт.` : '✗ Нет в наличии'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditing(item.id)
                      setEditForm({ price: item.price, quantity: item.quantity })
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
    </div>
  )
}
