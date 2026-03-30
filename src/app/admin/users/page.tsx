'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6"><Link href="/admin" className="text-gray-500 text-xl">←</Link><h1 className="font-bold text-gray-900 text-xl">Пользователи</h1></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по имени или телефону..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 mb-4"/>
        <div className="text-center py-16"><div className="text-4xl mb-2">👥</div><p className="text-gray-500 text-sm">Требуется admin API для загрузки пользователей</p></div>
      </div>
    </AppLayout>
  )
}
