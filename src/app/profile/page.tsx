'use client'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth, signOut } from '@/hooks/useAuth'

const MENU = [
  { href: '/profile/orders',    icon: '📦', label: 'История заказов',  desc: 'Все ваши заказы' },
  { href: '/profile/medicines', icon: '💊', label: 'Мои лекарства',    desc: 'Сохранённые лекарства' },
  { href: '/profile/schedule',  icon: '📅', label: 'График приёма',    desc: 'Расписание и напоминания' },
  { href: '/ai-chat',           icon: '🤖', label: 'AI Помощник',      desc: 'Вопросы о лекарствах' },
]

const ROLE_LABELS: Record<string, string> = {
  user: 'Покупатель', pharmacy: 'Аптека', courier: 'Курьер', admin: 'Администратор'
}

export default function ProfilePage() {
  const { user, loading } = useAuth()

  // Показываем skeleton пока грузится
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex-shrink-0"/>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-100 rounded w-1/2"/>
                <div className="h-4 bg-gray-100 rounded w-1/3"/>
              </div>
            </div>
          </div>
          {Array.from({length:4}).map((_,i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}
        </div>
      </AppLayout>
    )
  }

  // Не авторизован
  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <span className="text-6xl mb-4">👤</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Войдите в аккаунт</h2>
          <p className="text-gray-500 text-sm text-center mb-8 max-w-xs">Чтобы делать заказы, отслеживать доставку и использовать все функции TezDavo</p>
          <Link href="/login" className="w-full max-w-xs text-center bg-blue-600 text-white py-3.5 rounded-xl font-bold mb-3 block">
            Войти как покупатель
          </Link>
          <div className="flex gap-3 w-full max-w-xs">
            <Link href="/register-pharmacy" className="flex-1 text-center border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">
              🏪 Аптека
            </Link>
            <Link href="/register-courier" className="flex-1 text-center border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">
              🚴 Курьер
            </Link>
          </div>
          <p className="text-gray-400 text-xs mt-4">
            Нет аккаунта? <Link href="/register" className="text-blue-600 font-medium">Регистрация</Link>
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* User card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-700 flex-shrink-0">
              {user.full_name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{user.full_name}</p>
              <p className="text-gray-500 text-sm">{user.phone}</p>
              {user.email && <p className="text-gray-400 text-xs">{user.email}</p>}
              <span className="inline-flex mt-1.5 bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Role-specific dashboard link */}
        {user.role === 'pharmacy' && (
          <Link href="/pharmacy/dashboard" className="flex items-center gap-3 bg-blue-600 text-white p-4 rounded-xl mb-4 hover:bg-blue-700 transition-colors">
            <span className="text-2xl">🏪</span>
            <div><p className="font-semibold">Кабинет аптеки</p><p className="text-blue-200 text-xs">Заказы, склад, статистика</p></div>
            <span className="ml-auto text-xl">→</span>
          </Link>
        )}
        {user.role === 'courier' && (
          <Link href="/courier/dashboard" className="flex items-center gap-3 bg-green-600 text-white p-4 rounded-xl mb-4 hover:bg-green-700 transition-colors">
            <span className="text-2xl">🚴</span>
            <div><p className="font-semibold">Кабинет курьера</p><p className="text-green-200 text-xs">Доступные заказы и маршруты</p></div>
            <span className="ml-auto text-xl">→</span>
          </Link>
        )}
        {user.role === 'admin' && (
          <Link href="/admin" className="flex items-center gap-3 bg-purple-600 text-white p-4 rounded-xl mb-4 hover:bg-purple-700 transition-colors">
            <span className="text-2xl">⚙️</span>
            <div><p className="font-semibold">Админ панель</p><p className="text-purple-200 text-xs">Управление платформой</p></div>
            <span className="ml-auto text-xl">→</span>
          </Link>
        )}

        {/* Menu */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          {MENU.map((item, i, arr) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <span className="text-xl w-8 text-center">{item.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </Link>
          ))}
        </div>

        <button onClick={signOut}
          className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 transition-colors">
          Выйти из аккаунта
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">TezDavo v0.1.0 · Toshkent</p>
      </div>
    </AppLayout>
  )
}
