'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { formatPrice } from '@/lib/utils'

interface Medicine { id:string; name:string; category:string; min_price?:number }

const CATEGORIES = [
  {icon:'💊',name:'Обезболивающие'},{icon:'🧬',name:'Антибиотики'},{icon:'❤️',name:'Сердечные'},
  {icon:'🤧',name:'Антигистаминные'},{icon:'🧴',name:'Витамины'},{icon:'🌿',name:'Желудочно-кишечные'},
]

export default function HomePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [popular, setPopular] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/medicines?limit=6').then(r=>r.json()).then(d=>{setPopular(d.medicines||[]);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); if(search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`) }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 lg:p-10 mb-8">
          <h1 className="text-white text-2xl lg:text-3xl font-bold mb-2">Tez yetkazib berish 💊</h1>
          <p className="text-blue-200 mb-6 text-sm lg:text-base">Toshkent aptekalaridan 30–60 daqiqada</p>
          <form onSubmit={handleSearch} className="flex gap-2 lg:gap-3 max-w-xl">
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Dori nomini kiriting..."
              className="flex-1 px-4 lg:px-5 py-3 rounded-xl text-gray-900 text-sm lg:text-base outline-none border-0"/>
            <button type="submit" className="bg-white text-blue-600 font-bold px-5 lg:px-6 py-3 rounded-xl whitespace-nowrap text-sm lg:text-base">Qidirish</button>
          </form>
          <div className="flex gap-2 mt-4 flex-wrap">
            {['Paracetamol','Ibuprofen','No-Shpa','Omeprazol'].map(tag=>(
              <button key={tag} onClick={()=>router.push(`/search?q=${tag}`)}
                className="bg-blue-500 hover:bg-blue-400 text-white text-xs lg:text-sm px-3 py-1.5 rounded-full transition-colors">{tag}</button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 lg:gap-5 mb-8">
          {[{icon:'⚡',t:'Tez yetkazish',s:'30–60 daqiqa'},{icon:'💰',t:'Narxlarni solishtirish',s:'Eng arzon narx'},{icon:'🏪',t:'Ko\'p aptekalar',s:'Butun Toshkent'}].map(f=>(
            <div key={f.t} className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm flex items-center gap-3 lg:gap-4">
              <span className="text-2xl lg:text-3xl">{f.icon}</span>
              <div><div className="font-semibold text-gray-900 text-xs lg:text-sm">{f.t}</div><div className="text-xs text-gray-400">{f.s}</div></div>
            </div>
          ))}
        </div>

        {/* Categories */}
        <h2 className="font-bold text-gray-900 text-lg mb-4">Kategoriyalar</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-8">
          {CATEGORIES.map(cat=>(
            <Link key={cat.name} href={`/search?category=${cat.name}`}
              className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl lg:text-3xl mb-1 lg:mb-2">{cat.icon}</div>
              <div className="text-xs text-gray-700 font-medium leading-tight">{cat.name}</div>
            </Link>
          ))}
        </div>

        {/* Popular medicines */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-lg">Mashhur dorilar</h2>
          <Link href="/search" className="text-blue-600 text-sm font-medium">Barchasi →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-8">
          {loading
            ? Array.from({length:6}).map((_,i)=><div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse"><div className="h-20 bg-gray-100 rounded-lg mb-3"/><div className="h-4 bg-gray-100 rounded w-3/4 mb-2"/><div className="h-3 bg-gray-100 rounded w-1/2"/></div>)
            : popular.map(med=>(
                <Link key={med.id} href={`/medicine/${med.id}`}
                  className="bg-white rounded-xl p-3 lg:p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-blue-50 rounded-lg h-16 lg:h-20 flex items-center justify-center mb-2 lg:mb-3"><span className="text-3xl lg:text-4xl">💊</span></div>
                  <div className="font-semibold text-gray-900 text-sm truncate mb-0.5">{med.name}</div>
                  <div className="text-xs text-gray-400 mb-1 lg:mb-2">{med.category}</div>
                  {med.min_price && <div className="font-bold text-blue-600 text-sm">от {formatPrice(med.min_price)}</div>}
                </Link>
              ))
          }
        </div>

        {/* Banners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link href="/ai-chat" className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <span className="text-3xl">🤖</span><div className="flex-1"><div className="font-semibold text-gray-900 text-sm">AI Tibbiy yordamchi</div><div className="text-xs text-gray-500">Dorilar haqida savollar</div></div><span className="text-blue-400">→</span>
          </Link>
          <Link href="/profile/schedule" className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl p-4">
            <span className="text-3xl">📅</span><div className="flex-1"><div className="font-semibold text-gray-900 text-sm">Dori qabul jadvali</div><div className="text-xs text-gray-500">Eslatmalar va jadval</div></div><span className="text-green-400">→</span>
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
