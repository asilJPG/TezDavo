'use client'
// src/app/admin/users/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { User, UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Покупатель',
  pharmacy: 'Аптека',
  courier: 'Курьер',
  admin: 'Администратор',
}

const ROLE_COLORS: Record<UserRole, string> = {
  user: 'bg-blue-100 text-blue-700',
  pharmacy: 'bg-teal-100 text-teal-700',
  courier: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    // В реальном приложении: /api/admin/users
    setLoading(false)
  }

  const filtered = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/admin" className="text-gray-600 text-xl">←</Link>
        <h1 className="font-semibold text-gray-900 flex-1">Пользователи</h1>
        <span className="text-sm text-gray-400">{users.length}</span>
      </header>

      <div className="px-4 pt-4 space-y-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени или телефону..."
          className="input"
        />

        {/* Role filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {(['all', 'user', 'pharmacy', 'courier', 'admin'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {role === 'all' ? 'Все' : ROLE_LABELS[role]}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-gray-400 py-10">Загрузка...</p>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">Пользователей не найдено</p>
          </div>
        )}

        {filtered.map(user => (
          <div key={user.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-base font-bold text-gray-600">
                {user.full_name.slice(0, 1)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{user.full_name}</p>
                <p className="text-xs text-gray-400">{user.phone}</p>
                {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400">Зарегистрирован: {formatDate(user.created_at)}</p>
              <button className="text-red-500 text-xs font-medium">Заблокировать</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
