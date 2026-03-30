'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { ScheduleForm } from '@/components/schedule/ScheduleForm'

interface Schedule { id:string; medicine_name:string; dosage:string; times_per_day:number; schedule_times:string[]; start_date:string; end_date?:string; notes?:string; is_active:boolean }
interface TodayItem { schedule_id:string; medicine_name:string; dosage:string; time:string; status:'pending'|'taken'|'skipped' }

function buildToday(schedules: Schedule[]): TodayItem[] {
  const today = new Date(); const items: TodayItem[] = []
  for (const s of schedules) {
    if (!s.is_active) continue
    const start = new Date(s.start_date); const end = s.end_date ? new Date(s.end_date) : null
    if (today < start || (end && today > end)) continue
    for (const time of s.schedule_times) items.push({ schedule_id:s.id, medicine_name:s.medicine_name, dosage:s.dosage, time, status:'pending' })
  }
  return items.sort((a,b) => a.time.localeCompare(b.time))
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [today, setToday] = useState<TodayItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'today'|'list'>('today')
  const now = new Date(); const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

  useEffect(() => { load() }, [])
  const load = async () => { setLoading(true); const r = await fetch('/api/schedule?active=true'); const d = await r.json(); const list = d.schedules||[]; setSchedules(list); setToday(buildToday(list)); setLoading(false) }

  const mark = async (item: TodayItem, status: 'taken'|'skipped') => {
    const date = new Date().toISOString().split('T')[0]
    await fetch(`/api/schedule/${item.schedule_id}/log`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status, scheduled_time:`${date}T${item.time}:00`, date }) })
    setToday(p => p.map(i => i.schedule_id===item.schedule_id && i.time===item.time ? {...i,status} : i))
  }
  const del = async (id: string) => { await fetch(`/api/schedule/${id}`,{method:'DELETE'}); load() }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3"><Link href="/profile" className="text-gray-500 text-xl lg:hidden">←</Link><h1 className="font-bold text-gray-900 text-xl">График приёма</h1></div>
          <button onClick={()=>setShowForm(true)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl font-medium">+ Добавить</button>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-3 divide-x text-center mb-4">
          <div><div className="text-2xl font-bold text-green-600">{today.filter(t=>t.status==='taken').length}</div><div className="text-xs text-gray-500">Принято</div></div>
          <div><div className="text-2xl font-bold text-gray-900">{today.length}</div><div className="text-xs text-gray-500">Сегодня</div></div>
          <div><div className="text-2xl font-bold text-orange-500">{today.filter(t=>t.status==='pending').length}</div><div className="text-xs text-gray-500">Осталось</div></div>
        </div>

        <div className="flex gap-2 mb-4">
          {(['today','list'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab===t?'bg-blue-600 text-white':'bg-white text-gray-600 shadow-sm'}`}>
              {t==='today'?'Сегодня':'Мои лекарства'}
            </button>
          ))}
        </div>

        {loading && <div className="space-y-2">{Array.from({length:3}).map((_,i)=><div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"/>)}</div>}

        {tab==='today' && !loading && (
          today.length===0
            ? <div className="text-center py-16"><div className="text-4xl mb-3">✅</div><p className="text-gray-500 text-sm">На сегодня нет приёмов</p><button onClick={()=>setShowForm(true)} className="text-blue-600 text-sm mt-2 font-medium">Добавить лекарство</button></div>
            : <div className="space-y-2">
                {today.map((item,i)=>(
                  <div key={i} className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 ${item.time===cur?'ring-2 ring-blue-500':''}`}>
                    <div className={`font-bold text-sm min-w-12 text-center ${item.time<cur && item.status==='pending'?'text-gray-300':'text-blue-600'}`}>{item.time}</div>
                    <div className="flex-1"><div className="font-medium text-gray-900 text-sm">{item.medicine_name}</div><div className="text-xs text-gray-500">{item.dosage}</div></div>
                    {item.status==='taken'   && <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">✓</span>}
                    {item.status==='skipped' && <span className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center">✗</span>}
                    {item.status==='pending' && <div className="flex gap-1"><button onClick={()=>mark(item,'skipped')} className="w-8 h-8 rounded-full border-2 border-gray-200 text-gray-300 flex items-center justify-center">✗</button><button onClick={()=>mark(item,'taken')} className="w-8 h-8 rounded-full border-2 border-green-400 text-green-500 flex items-center justify-center font-bold">✓</button></div>}
                  </div>
                ))}
              </div>
        )}

        {tab==='list' && !loading && (
          schedules.length===0
            ? <div className="text-center py-16"><div className="text-4xl mb-3">📋</div><p className="text-gray-500 text-sm">Нет активных лекарств</p><button onClick={()=>setShowForm(true)} className="text-blue-600 text-sm mt-2 font-medium">Добавить</button></div>
            : <div className="space-y-3">
                {schedules.map(s=>(
                  <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{s.medicine_name}</div>
                        <div className="text-sm text-gray-500">{s.dosage} · {s.times_per_day}× в день</div>
                        <div className="flex gap-2 mt-2 flex-wrap">{s.schedule_times.map(t=><span key={t} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-lg">{t}</span>)}</div>
                        <div className="text-xs text-gray-400 mt-1">{s.start_date}{s.end_date?` → ${s.end_date}`:' (бессрочно)'}</div>
                        {s.notes && <div className="text-xs text-gray-500 italic mt-1">{s.notes}</div>}
                      </div>
                      <button onClick={()=>del(s.id)} className="text-red-400 text-xl ml-2 leading-none">×</button>
                    </div>
                  </div>
                ))}
              </div>
        )}

        <ScheduleForm open={showForm} onClose={()=>setShowForm(false)} onSaved={load}/>
      </div>
    </AppLayout>
  )
}
