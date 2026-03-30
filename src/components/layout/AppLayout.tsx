'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/',                 icon: '🏠', label: 'Главная' },
  { href: '/search',           icon: '🔍', label: 'Поиск' },
  { href: '/cart',             icon: '🛒', label: 'Корзина',        cart: true },
  { href: '/profile/schedule', icon: '📅', label: 'График приёма' },
  { href: '/ai-chat',          icon: '🤖', label: 'AI Помощник' },
  { href: '/profile',          icon: '👤', label: 'Профиль' },
]

const ROLE_NAV: Record<string, { href: string; icon: string; label: string }[]> = {
  pharmacy: [
    { href: '/pharmacy/dashboard', icon: '🏪', label: 'Кабинет аптеки' },
    { href: '/pharmacy/inventory', icon: '📦', label: 'Склад' },
  ],
  courier: [
    { href: '/courier/dashboard', icon: '🚴', label: 'Кабинет курьера' },
  ],
  admin: [
    { href: '/admin',             icon: '⚙️', label: 'Админ панель' },
    { href: '/admin/users',       icon: '👥', label: 'Пользователи' },
    { href: '/admin/pharmacies',  icon: '🏪', label: 'Аптеки' },
  ],
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { count } = useCart()
  const { user } = useAuth()

  const roleLinks = user?.role ? (ROLE_NAV[user.role] ?? []) : []

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r z-40 shadow-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-6 py-5 border-b hover:bg-gray-50 transition-colors">
          <span className="text-3xl">💊</span>
          <div>
            <p className="font-bold text-gray-900 text-xl leading-tight">TezDavo</p>
            <p className="text-xs text-gray-400">Доставка лекарств</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {/* Main nav */}
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors relative',
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}>
                <span className="text-lg w-6 text-center flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.cart && count > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center font-medium">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Role-specific links */}
          {roleLinks.length > 0 && (
            <>
              <div className="px-3 pt-4 pb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Кабинет</p>
              </div>
              {roleLinks.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                      active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                    )}>
                    <span className="text-lg w-6 text-center flex-shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* Bottom user block */}
        <div className="px-3 py-4 border-t">
          {user ? (
            <Link href="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                {user.full_name?.slice(0, 1)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{user.phone || user.email}</p>
              </div>
            </Link>
          ) : (
            <div className="space-y-2">
              <Link href="/login"
                className="block w-full text-center bg-blue-600 text-white text-sm py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Войти
              </Link>
              <Link href="/register"
                className="block w-full text-center border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── DESKTOP MAIN CONTENT ── */}
      <div className="hidden lg:block lg:ml-64 min-h-screen">
        {children}
      </div>

      {/* ── MOBILE CONTENT ── */}
      <div className="lg:hidden pb-16">
        {children}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-5">
          {NAV.slice(0, 5).map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex flex-col items-center py-2 relative transition-colors',
                  active ? 'text-blue-600' : 'text-gray-400'
                )}>
                <span className="text-xl">{item.icon}</span>
                {item.cart && count > 0 && (
                  <span className="absolute top-1 right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
                <span className="text-xs mt-0.5 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
