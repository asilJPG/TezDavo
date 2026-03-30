'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'

interface Medicine {
  id: string
  name: string
  generic_name?: string
  category: string
  manufacturer?: string
  requires_prescription: boolean
  min_price?: number
  pharmacy_count?: number
}

const CATEGORIES = ['Все','Обезболивающие','Антибиотики','Антигистаминные','Витамины','Желудочно-кишечные','Сердечные','Спазмолитики','Противовирусные']

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { count } = useCart()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'Все')
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const search = useCallback(async (q: string, cat: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (cat && cat !== 'Все') params.set('category', cat)
      const res = await fetch(`/api/medicines?${params}`)
      const data = await res.json()
      setMedicines(data.medicines || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { search(query, category) }, [query, category, search])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); search(query, category) }

  const MedicineCard = ({ med }: { med: Medicine }) => (
    <Link href={`/medicine/${med.id}`} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-2xl">💊</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{med.name}</p>
        {med.generic_name && <p className="text-xs text-gray-400 truncate">{med.generic_name}</p>}
        <p className="text-xs text-gray-500">{med.category} {med.manufacturer ? `· ${med.manufacturer}` : ''}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {med.requires_prescription && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">Рецепт</span>}
          {med.min_price ? <span className="text-blue-600 font-semibold text-sm">от {formatPrice(med.min_price)}</span> : <span className="text-gray-400 text-xs">Нет в аптеках</span>}
          {med.pharmacy_count ? <span className="text-gray-400 text-xs">· {med.pharmacy_count} аптек</span> : null}
        </div>
      </div>
      <span className="text-gray-300 text-lg flex-shrink-0">›</span>
    </Link>
  )

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse flex gap-3">
      <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop layout */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r fixed h-full z-40 flex flex-col">
          <div className="px-6 py-5 border-b">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">💊</span>
              <span className="font-bold text-gray-900 text-xl">TezDavo</span>
            </Link>
          </div>
          <div className="px-4 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Категории</p>
            <div className="space-y-1">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${category === cat ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>
        {/* Main */}
        <main className="flex-1 ml-64 p-8">
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Название лекарства, активное вещество..."
              className="flex-1 border border-gray-200 rounded-xl px-5 py-3.5 text-base outline-none focus:border-blue-400" />
            <button type="submit" className="bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold">Найти</button>
            {count > 0 && (
              <Link href="/cart" className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-3.5 rounded-xl text-sm font-medium">
                🛒 Корзина <span className="bg-red-500 text-white text-xs rounded-full px-1.5">{count}</span>
              </Link>
            )}
          </form>
          {!loading && <p className="text-sm text-gray-500 mb-4">{total > 0 ? `Найдено: ${total} лекарств` : 'Ничего не найдено'}</p>}
          <div className="space-y-3">
            {loading ? Array.from({length:5}).map((_,i) => <SkeletonCard key={i} />) : medicines.map(med => <MedicineCard key={med.id} med={med} />)}
          </div>
          {!loading && medicines.length === 0 && (
            <div className="text-center py-24">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-500">Лекарство не найдено</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden">
        <header className="bg-white border-b px-4 pt-3 pb-3 sticky top-0 z-10">
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <Link href="/" className="text-gray-600 text-xl flex items-center">←</Link>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Поиск лекарств..." className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none" />
            {query && <button type="button" onClick={() => setQuery('')} className="text-gray-400 text-xl">×</button>}
          </form>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {cat}
              </button>
            ))}
          </div>
        </header>
        <div className="px-4 pt-4 pb-24 space-y-3">
          {!loading && <p className="text-xs text-gray-500">{total > 0 ? `Найдено: ${total}` : 'Ничего не найдено'}</p>}
          {loading ? Array.from({length:4}).map((_,i) => <SkeletonCard key={i} />) : medicines.map(med => <MedicineCard key={med.id} med={med} />)}
          {!loading && medicines.length === 0 && (
            <div className="text-center py-16"><div className="text-5xl mb-3">🔍</div><p className="text-gray-500">Лекарство не найдено</p></div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return <Suspense><SearchContent /></Suspense>
}
