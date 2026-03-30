'use client'
// src/components/layout/BottomNav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',                icon: '🏠', label: 'Главная' },
  { href: '/search',          icon: '🔍', label: 'Поиск' },
  { href: '/cart',            icon: '🛒', label: 'Корзина', badge: true },
  { href: '/ai-chat',         icon: '🤖', label: 'AI Чат' },
  { href: '/profile',         icon: '👤', label: 'Профиль' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { count } = useCart()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center py-2 px-1 transition-colors relative',
                active ? 'text-blue-600' : 'text-gray-400'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {item.badge && count > 0 && (
                <span className="absolute top-1 right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {count > 9 ? '9+' : count}
                </span>
              )}
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────
// src/components/layout/PageHeader.tsx
'use client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  rightSlot?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, showBack = true, rightSlot, className }: PageHeaderProps) {
  const router = useRouter()
  return (
    <header className={cn('bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-40', className)}>
      {showBack && (
        <button onClick={() => router.back()} className="text-gray-500 text-xl flex-shrink-0 w-8">
          ←
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
      {rightSlot}
    </header>
  )
}
