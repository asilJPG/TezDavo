'use client'
// src/app/profile/page.tsx — Кабинет пользователя

import Link from 'next/link'
import { useAuth, signOut } from '@/hooks/useAuth'

const MENU_ITEMS = [
  { href: '/profile/orders',    icon: '📦', label: 'История заказов',   desc: 'Все ваши заказы' },
  { href: '/profile/medicines', icon: '💊', label: 'Мои лекарства',     desc: 'Сохранённые лекарства' },
  { href: '/profile/schedule',  icon: '📅', label: 'График приёма',     desc: 'Расписание и напоминания' },
  { href: '/ai-chat',           icon: '🤖', label: 'AI Медпомощник',    desc: 'Вопросы о лекарствах' },
]

export default function ProfilePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 max-w-md mx-auto">
        <span className="text-5xl mb-4">👤</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Войдите в аккаунт</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Чтобы делать заказы и отслеживать доставку</p>
        <Link href="/login" className="w-full max-w-xs text-center bg-blue-600 text-white py-3.5 rounded-xl font-bold">
          Войти
        </Link>
        <Link href="/register" className="mt-3 text-blue-600 text-sm font-medium">
          Зарегистрироваться
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24">
      <header className="bg-white border-b px-4 py-3">
        <h1 className="font-bold text-gray-900 text-lg">Профиль</h1>
      </header>

      {/* User info */}
      <div className="bg-white px-4 py-5 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-700">
            {user.full_name.slice(0, 1)}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{user.full_name}</p>
            <p className="text-gray-500 text-sm">{user.phone}</p>
            <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full mt-1">
              {user.role === 'user' ? 'Покупатель' : user.role === 'pharmacy' ? 'Аптека' : user.role === 'courier' ? 'Курьер' : 'Администратор'}
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard links for pharmacy/courier */}
      {user.role === 'pharmacy' && (
        <Link href="/pharmacy/dashboard" className="flex items-center gap-3 bg-blue-600 text-white mx-4 mb-3 p-4 rounded-xl">
          <span className="text-2xl">🏪</span>
          <div>
            <p className="font-semibold">Кабинет аптеки</p>
            <p className="text-blue-200 text-xs">Управление заказами и складом</p>
          </div>
          <span className="ml-auto">→</span>
        </Link>
      )}
      {user.role === 'courier' && (
        <Link href="/courier/dashboard" className="flex items-center gap-3 bg-green-600 text-white mx-4 mb-3 p-4 rounded-xl">
          <span className="text-2xl">🚴</span>
          <div>
            <p className="font-semibold">Кабинет курьера</p>
            <p className="text-green-200 text-xs">Доступные заказы</p>
          </div>
          <span className="ml-auto">→</span>
        </Link>
      )}
      {user.role === 'admin' && (
        <Link href="/admin" className="flex items-center gap-3 bg-purple-600 text-white mx-4 mb-3 p-4 rounded-xl">
          <span className="text-2xl">⚙️</span>
          <div>
            <p className="font-semibold">Админ панель</p>
            <p className="text-purple-200 text-xs">Управление платформой</p>
          </div>
          <span className="ml-auto">→</span>
        </Link>
      )}

      {/* Menu */}
      <div className="bg-white mx-0 divide-y">
        {MENU_ITEMS.map(item => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-4">
            <span className="text-xl w-8">{item.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <span className="text-gray-300">›</span>
          </Link>
        ))}
      </div>

      <div className="px-4 mt-4">
        <button
          onClick={signOut}
          className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl font-medium text-sm"
        >
          Выйти из аккаунта
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4 mb-8">
        TezDavo v0.1.0 · Ташкент, Узбекистан
      </p>
    </div>
  )
}
