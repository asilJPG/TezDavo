'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'

const DEMO = [
  { id:'1', name:'Парацетамол', category:'Обезболивающие', note:'При температуре' },
  { id:'3', name:'Амоксициллин', category:'Антибиотики', note:'По назначению врача' },
  { id:'4', name:'Омепразол', category:'Желудочно-кишечные', note:'' },
]
export default function MedicinesPage() {
  const [saved, setSaved] = useState(DEMO)
  const [search, setSearch] = useState('')
  const filtered = saved.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6"><Link href="/profile" className="text-gray-500 text-xl">←</Link><h1 className="font-bold text-gray-900 text-xl">Мои лекарства</h1></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 mb-4"/>
        {filtered.length === 0 && <div className="text-center py-16"><div className="text-5xl mb-3">💊</div><p className="text-gray-500">Нет сохранённых лекарств</p><Link href="/search" className="text-blue-600 text-sm mt-2 block font-medium">Найти лекарства →</Link></div>}
        <div className="space-y-3">
          {filtered.map(med=>(
            <div key={med.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-xl">💊</span></div>
              <div className="flex-1 min-w-0">
                <Link href={`/medicine/${med.id}`}><p className="font-semibold text-gray-900 text-sm">{med.name}</p></Link>
                <p className="text-xs text-gray-400">{med.category}</p>
                {med.note && <p className="text-xs text-gray-500 italic">{med.note}</p>}
              </div>
              <div className="flex flex-col gap-1 text-right">
                <Link href={`/medicine/${med.id}`} className="text-blue-600 text-xs font-medium">Найти →</Link>
                <button onClick={()=>setSaved(p=>p.filter(m=>m.id!==med.id))} className="text-red-400 text-xs">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
