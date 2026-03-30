'use client'
// src/app/profile/medicines/page.tsx — Мои лекарства (избранное)

import { useState } from 'react'
import Link from 'next/link'

// В реальном приложении это будет отдельная таблица saved_medicines
// Для MVP используем localStorage
const DEMO_SAVED = [
  { id: '1', name: 'Парацетамол', category: 'Обезболивающие', note: 'Принимаю при температуре' },
  { id: '3', name: 'Амоксициллин', category: 'Антибиотики', note: 'По назначению врача' },
  { id: '4', name: 'Омепразол', category: 'Желудочно-кишечные', note: '' },
]

export default function SavedMedicinesPage() {
  const [saved, setSaved] = useState(DEMO_SAVED)
  const [search, setSearch] = useState('')

  const filtered = saved.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  const remove = (id: string) => setSaved(prev => prev.filter(m => m.id !== id))

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/profile" className="text-gray-600 text-xl">←</Link>
        <h1 className="font-semibold text-gray-900 flex-1">Мои лекарства</h1>
      </header>

      <div className="px-4 pt-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="input mb-4"
        />

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">💊</div>
            <p className="text-gray-500">Нет сохранённых лекарств</p>
            <Link href="/search" className="text-blue-600 text-sm mt-2 block font-medium">
              Найти лекарства →
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(med => (
            <div key={med.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💊</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/medicine/${med.id}`}>
                  <p className="font-semibold text-gray-900 text-sm">{med.name}</p>
                </Link>
                <p className="text-xs text-gray-400">{med.category}</p>
                {med.note && <p className="text-xs text-gray-500 mt-0.5 italic">{med.note}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <Link
                  href={`/medicine/${med.id}`}
                  className="text-blue-600 text-xs font-medium text-right"
                >
                  Найти →
                </Link>
                <button
                  onClick={() => remove(med.id)}
                  className="text-red-400 text-xs"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
