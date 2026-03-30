'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ScheduleForm } from '@/components/schedule/ScheduleForm'

interface Schedule {
  id: string
  medicine_name: string
  dosage: string
  times_per_day: number
  schedule_times: string[]
  start_date: string
  end_date?: string
  notes?: string
  is_active: boolean
}

interface TodayItem {
  schedule_id: string
  medicine_name: string
  dosage: string
  time: string
  status: 'pending' | 'taken' | 'skipped'
  log_id?: string
}

function buildTodayItems(schedules: Schedule[]): TodayItem[] {
  const today = new Date()
  const items: TodayItem[] = []
  for (const s of schedules) {
    if (!s.is_active) continue
    const start = new Date(s.start_date)
    const end = s.end_date ? new Date(s.end_date) : null
    if (today < start || (end && today > end)) continue
    for (const time of s.schedule_times) {
      items.push({ schedule_id: s.id, medicine_name: s.medicine_name, dosage: s.dosage, time, status: 'pending' })
    }
  }
  return items.sort((a, b) => a.time.localeCompare(b.time))
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [todayItems, setTodayItems] = useState<TodayItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'today' | 'list'>('today')

  useEffect(() => { fetchSchedules() }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/schedule?active=true')
      const data = await res.json()
      const list: Schedule[] = data.schedules || []
      setSchedules(list)
      setTodayItems(buildTodayItems(list))
    } finally {
      setLoading(false)
    }
  }

  const markDose = async (item: TodayItem, status: 'taken' | 'skipped') => {
    const today = new Date().toISOString().split('T')[0]
    const scheduledTime = `${today}T${item.time}:00`
    await fetch(`/api/schedule/${item.schedule_id}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, scheduled_time: scheduledTime, date: today }),
    })
    setTodayItems(prev => prev.map(i =>
      i.schedule_id === item.schedule_id && i.time === item.time ? { ...i, status } : i
    ))
  }

  const deleteSchedule = async (id: string) => {
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' })
    fetchSchedules()
  }

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const takenCount = todayItems.filter(t => t.status === 'taken').length

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-24 lg:max-w-2xl">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/profile" className="text-gray-600 text-xl lg:hidden">←</Link>
        <h1 className="font-semibold text-gray-900 flex-1">График приёма</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-xl font-medium">
          + Добавить
        </button>
      </header>

      {/* Stats */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-3 divide-x text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{takenCount}</div>
            <div className="text-xs text-gray-500">Принято</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{todayItems.length}</div>
            <div className="text-xs text-gray-500">Всего сегодня</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-500">{todayItems.filter(t => t.status === 'pending').length}</div>
            <div className="text-xs text-gray-500">Осталось</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 flex gap-2">
        {(['today','list'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
            {tab === 'today' ? 'Сегодня' : 'Мои лекарства'}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {loading && <div className="text-center py-10 text-gray-400">Загрузка...</div>}

        {activeTab === 'today' && !loading && (
          todayItems.length === 0
            ? <div className="text-center py-16">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-500 text-sm">На сегодня нет приёмов</p>
                <button onClick={() => setShowForm(true)} className="text-blue-600 text-sm mt-2 font-medium">Добавить лекарство</button>
              </div>
            : todayItems.map((item, i) => {
                const isPast = item.time < currentTime
                return (
                  <div key={i} className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 ${item.time === currentTime.slice(0,5) ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className={`font-bold text-sm min-w-12 text-center ${isPast && item.status === 'pending' ? 'text-gray-300' : 'text-blue-600'}`}>{item.time}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{item.medicine_name}</div>
                      <div className="text-xs text-gray-500">{item.dosage}</div>
                    </div>
                    {item.status === 'taken' && <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">✓</span>}
                    {item.status === 'skipped' && <span className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm">✗</span>}
                    {item.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => markDose(item, 'skipped')} className="w-8 h-8 rounded-full border-2 border-gray-200 text-gray-300 flex items-center justify-center text-sm">✗</button>
                        <button onClick={() => markDose(item, 'taken')} className="w-8 h-8 rounded-full border-2 border-green-400 text-green-500 flex items-center justify-center text-sm font-bold">✓</button>
                      </div>
                    )}
                  </div>
                )
              })
        )}

        {activeTab === 'list' && !loading && (
          schedules.length === 0
            ? <div className="text-center py-16">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500 text-sm">Нет активных лекарств</p>
                <button onClick={() => setShowForm(true)} className="text-blue-600 text-sm mt-2 font-medium">Добавить лекарство</button>
              </div>
            : schedules.map(s => (
                <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{s.medicine_name}</div>
                      <div className="text-sm text-gray-500">{s.dosage} · {s.times_per_day}× в день</div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {s.schedule_times.map(t => (
                          <span key={t} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-lg">{t}</span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {s.start_date} {s.end_date ? `→ ${s.end_date}` : '(бессрочно)'}
                      </div>
                      {s.notes && <div className="text-xs text-gray-500 italic mt-1">{s.notes}</div>}
                    </div>
                    <button onClick={() => deleteSchedule(s.id)} className="text-red-400 text-xl ml-2 leading-none">×</button>
                  </div>
                </div>
              ))
        )}
      </div>

      <ScheduleForm open={showForm} onClose={() => setShowForm(false)} onSaved={fetchSchedules} />
    </div>
  )
}
