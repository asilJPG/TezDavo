'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { formatPrice } from '@/lib/utils'

interface Medicine {
  id: string; name: string; generic_name?: string; category: string
  manufacturer?: string; requires_prescription: boolean
  min_price?: number; pharmacy_count?: number
}

const CATEGORIES = ['Все','Обезболивающие','Антибиотики','Антигистаминные','Витамины','Желудочно-кишечные','Сердечные','Спазмолитики','Противовирусные']

function SearchContent() {
  const searchParams = useSearchParams()
  const [query, setQuery]       = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'Все')
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading]   = useState(false)
  const [total, setTotal]       = useState(0)

  const doSearch = useCallback(async (q: string, cat: string) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (cat && cat !== 'Все') p.set('category', cat)
      const data = await fetch(`/api/medicines?${p}`).then(r => r.json())
      setMedicines(data.medicines || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { doSearch(query, category) }, [query, category, doSearch])

  const Skeleton = () => (
    <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse flex gap-3">
      <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0"/>
      <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-2/3"/><div className="h-3 bg-gray-100 rounded w-1/2"/><div className="h-3 bg-gray-100 rounded w-1/3"/></div>
    </div>
  )

  const Card = ({ med }: { med: Medicine }) => (
    <Link href={`/medicine/${med.id}`} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-2xl">💊</span></div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{med.name}</p>
        {med.generic_name && <p className="text-xs text-gray-400 truncate">{med.generic_name}</p>}
        <p className="text-xs text-gray-500">{med.category}{med.manufacturer ? ` · ${med.manufacturer}` : ''}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {med.requires_prescription && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">Рецепт</span>}
          {med.min_price ? <span className="text-blue-600 font-semibold text-sm">от {formatPrice(med.min_price)}</span> : <span className="text-gray-400 text-xs">Нет в аптеках</span>}
          {med.pharmacy_count ? <span className="text-gray-400 text-xs">· {med.pharmacy_count} аптек</span> : null}
        </div>
      </div>
      <span className="text-gray-300 text-lg flex-shrink-0">›</span>
    </Link>
  )

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Search bar */}
        <form onSubmit={e => { e.preventDefault(); doSearch(query, category) }} className="flex gap-2 mb-5">
          {/* Кнопка назад на мобиле */}
          <Link href="/" className="lg:hidden flex items-center justify-center w-10 h-11 text-gray-500 text-xl flex-shrink-0">←</Link>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Поиск лекарств..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
          {query && <button type="button" onClick={() => setQuery('')} className="text-gray-400 text-xl px-1">×</button>}
          <button type="submit" className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap">Найти</button>
        </form>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-5">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Result count */}
        {!loading && <p className="text-sm text-gray-500 mb-4">{total > 0 ? `Найдено: ${total} лекарств` : ''}</p>}

        {/* Results */}
        <div className="space-y-3">
          {loading
            ? Array.from({length:5}).map((_,i) => <Skeleton key={i}/>)
            : medicines.map(med => <Card key={med.id} med={med}/>)
          }
        </div>

        {!loading && medicines.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">Ничего не найдено</p>
            <p className="text-gray-400 text-sm mt-1">Попробуйте другое название</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function SearchPage() {
  return <Suspense><SearchContent /></Suspense>
}
