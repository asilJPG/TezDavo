'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'

interface Medicine {
  id: string
  name: string
  category: string
  min_price?: number
  pharmacy_name?: string
}

const CATEGORIES = [
  { icon: '💊', name: 'Обезболивающие' },
  { icon: '🧬', name: 'Антибиотики' },
  { icon: '❤️', name: 'Сердечные' },
  { icon: '🤧', name: 'Антигистаминные' },
  { icon: '🧴', name: 'Витамины' },
  { icon: '🌿', name: 'Желудочно-кишечные' },
]

export default function HomePage() {
  const router = useRouter()
  const { count } = useCart()
  const [search, setSearch] = useState('')
  const [popular, setPopular] = useState<Medicine[]>([])
  const [loadingPopular, setLoadingPopular] = useState(true)

  useEffect(() => {
    // Загружаем популярные лекарства из БД (первые 6 из поиска)
    fetch('/api/medicines?limit=6')
      .then(r => r.json())
      .then(data => {
        setPopular(data.medicines || [])
        setLoadingPopular(false)
      })
      .catch(() => setLoadingPopular(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ───── DESKTOP SIDEBAR LAYOUT ───── */}
      <div className="hidden lg:flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col fixed h-full z-40">
          <div className="px-6 py-5 border-b">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💊</span>
              <span className="font-bold text-gray-900 text-xl">TezDavo</span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {[
              { href: '/',                icon: '🏠', label: 'Главная' },
              { href: '/search',          icon: '🔍', label: 'Поиск лекарств' },
              { href: '/cart',            icon: '🛒', label: 'Корзина', badge: count },
              { href: '/profile/schedule',icon: '📅', label: 'График приёма' },
              { href: '/ai-chat',         icon: '🤖', label: 'AI Помощник' },
              { href: '/profile',         icon: '👤', label: 'Профиль' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors relative">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge ? <span className="absolute right-3 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{item.badge}</span> : null}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-4 border-t">
            <Link href="/ai-chat" className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-xl px-3 py-3 text-sm font-medium">
              <span>🤖</span> Спросить AI помощника
            </Link>
          </div>
        </aside>

        {/* Desktop main */}
        <main className="flex-1 ml-64 p-8">
          {/* Hero search */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8">
            <h1 className="text-white text-3xl font-bold mb-2">Доставка лекарств</h1>
            <p className="text-blue-200 mb-6">Из ближайших аптек Ташкента за 30–60 минут</p>
            <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Название лекарства..."
                className="flex-1 px-5 py-3.5 rounded-xl text-gray-900 text-base outline-none border-0 shadow-sm" />
              <button type="submit" className="bg-white text-blue-600 font-bold px-6 py-3.5 rounded-xl shadow-sm whitespace-nowrap">
                Найти
              </button>
            </form>
            <div className="flex gap-2 mt-4 flex-wrap">
              {['Парацетамол', 'Ибупрофен', 'Но-Шпа', 'Омепразол'].map(tag => (
                <button key={tag} onClick={() => router.push(`/search?q=${tag}`)}
                  className="bg-blue-500 hover:bg-blue-400 text-white text-sm px-4 py-1.5 rounded-full transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            {[
              { icon: '⚡', title: 'Быстрая доставка', sub: '30–60 минут' },
              { icon: '💰', title: 'Сравнение цен',   sub: 'Лучшая цена' },
              { icon: '🏪', title: 'Аптеки рядом',    sub: 'Весь Ташкент' },
            ].map(s => (
              <div key={s.title} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <div className="font-semibold text-gray-900">{s.title}</div>
                  <div className="text-sm text-gray-400">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Categories */}
          <h2 className="font-bold text-gray-900 text-lg mb-4">Категории</h2>
          <div className="grid grid-cols-6 gap-4 mb-8">
            {CATEGORIES.map(cat => (
              <Link key={cat.name} href={`/search?category=${cat.name}`}
                className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="text-xs text-gray-700 font-medium leading-tight">{cat.name}</div>
              </Link>
            ))}
          </div>

          {/* Popular medicines from DB */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-lg">Популярные лекарства</h2>
            <Link href="/search" className="text-blue-600 text-sm font-medium">Все лекарства →</Link>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {loadingPopular
              ? Array.from({length: 6}).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                    <div className="h-20 bg-gray-100 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))
              : popular.map(med => (
                  <Link key={med.id} href={`/medicine/${med.id}`}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-blue-50 rounded-lg h-20 flex items-center justify-center mb-3">
                      <span className="text-4xl">💊</span>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm mb-0.5 truncate">{med.name}</div>
                    <div className="text-xs text-gray-400 mb-2">{med.category}</div>
                    {med.min_price && (
                      <div className="font-bold text-blue-600 text-sm">от {formatPrice(med.min_price)}</div>
                    )}
                  </Link>
                ))
            }
          </div>
        </main>
      </div>

      {/* ───── MOBILE LAYOUT ───── */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💊</span>
              <span className="font-bold text-gray-900">TezDavo</span>
            </div>
            <div className="flex gap-3 items-center">
              <Link href="/ai-chat" className="text-blue-600 text-sm font-medium">AI</Link>
              <Link href="/cart" className="relative">
                <span className="text-xl">🛒</span>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{count}</span>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile Hero */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 pt-6 pb-10">
          <p className="text-blue-200 text-sm mb-1">Ташкент, Узбекистан</p>
          <h1 className="text-white text-xl font-bold mb-4">Доставка лекарств</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Найти лекарство..."
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-sm outline-none border-0" />
            <button type="submit" className="bg-white text-blue-600 font-semibold px-4 py-3 rounded-xl text-sm">
              Найти
            </button>
          </form>
          <div className="flex gap-2 mt-3 flex-wrap">
            {['Парацетамол', 'Ибупрофен', 'Но-Шпа'].map(tag => (
              <button key={tag} onClick={() => router.push(`/search?q=${tag}`)}
                className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full">{tag}</button>
            ))}
          </div>
        </section>

        <div className="px-4 -mt-4 pb-24">
          {/* Features */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-5 grid grid-cols-3 gap-2 text-center">
            {[{icon:'⚡',t:'Быстро',s:'30-60 мин'},{icon:'💰',t:'Дёшево',s:'Лучшая цена'},{icon:'🤖',t:'AI Помощник',s:'24/7'}].map(f => (
              <div key={f.t}>
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-xs text-gray-700 font-medium">{f.t}</div>
                <div className="text-xs text-gray-400">{f.s}</div>
              </div>
            ))}
          </div>

          {/* Categories */}
          <h2 className="font-semibold text-gray-900 mb-3">Категории</h2>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {CATEGORIES.map(cat => (
              <Link key={cat.name} href={`/search?category=${cat.name}`}
                className="bg-white rounded-xl p-3 text-center shadow-sm">
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-xs text-gray-700 font-medium leading-tight">{cat.name}</div>
              </Link>
            ))}
          </div>

          {/* Popular from DB */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Популярные</h2>
            <Link href="/search" className="text-blue-600 text-sm">Все →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {loadingPopular
              ? Array.from({length: 4}).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 shadow-sm animate-pulse">
                    <div className="h-16 bg-gray-100 rounded-lg mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))
              : popular.slice(0,4).map(med => (
                  <Link key={med.id} href={`/medicine/${med.id}`}
                    className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="bg-blue-50 rounded-lg h-16 flex items-center justify-center mb-2">
                      <span className="text-3xl">💊</span>
                    </div>
                    <div className="font-medium text-gray-900 text-sm truncate">{med.name}</div>
                    <div className="text-xs text-gray-400 mb-1">{med.category}</div>
                    {med.min_price && (
                      <div className="font-semibold text-blue-600 text-sm">{formatPrice(med.min_price)}</div>
                    )}
                  </Link>
                ))
            }
          </div>

          {/* Banners */}
          <Link href="/ai-chat" className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-3">
            <span className="text-3xl">🤖</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm">AI Медицинский помощник</div>
              <div className="text-xs text-gray-500">Вопросы о лекарствах, дозировке, побочных эффектах</div>
            </div>
            <span className="text-blue-400">→</span>
          </Link>
          <Link href="/profile/schedule" className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl p-4 mb-3">
            <span className="text-3xl">📅</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm">График приёма лекарств</div>
              <div className="text-xs text-gray-500">Напоминания утром, днём, вечером</div>
            </div>
            <span className="text-green-400">→</span>
          </Link>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
          <div className="grid grid-cols-5 py-1">
            {[
              {href:'/',         icon:'🏠', label:'Главная'},
              {href:'/search',   icon:'🔍', label:'Поиск'},
              {href:'/cart',     icon:'🛒', label:'Корзина', badge: count},
              {href:'/ai-chat',  icon:'🤖', label:'AI Чат'},
              {href:'/profile',  icon:'👤', label:'Профиль'},
            ].map(item => (
              <Link key={item.href} href={item.href} className="flex flex-col items-center py-2 relative">
                <span className="text-xl">{item.icon}</span>
                {item.badge ? <span className="absolute top-1 right-4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{item.badge}</span> : null}
                <span className="text-xs text-gray-500 mt-0.5">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
