'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface ScheduleFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '16:00', '20:00'],
}

export function ScheduleForm({ open, onClose, onSaved }: ScheduleFormProps) {
  const [form, setForm] = useState({
    medicine_name: '',
    dosage: '',
    times_per_day: 1,
    schedule_times: ['08:00'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setTimesCount = (n: number) => {
    setForm(prev => ({ ...prev, times_per_day: n, schedule_times: DEFAULT_TIMES[n] || ['08:00'] }))
  }

  const setTime = (i: number, v: string) => {
    setForm(prev => {
      const times = [...prev.schedule_times]
      times[i] = v
      return { ...prev, schedule_times: times }
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Ошибка')
        return
      }
      onSaved()
      onClose()
      setForm({ medicine_name: '', dosage: '', times_per_day: 1, schedule_times: ['08:00'], start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Добавить лекарство">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Название *</label>
          <input required value={form.medicine_name}
            onChange={e => setForm(p => ({ ...p, medicine_name: e.target.value }))}
            placeholder="Например: Амоксициллин"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Дозировка *</label>
          <input required value={form.dosage}
            onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))}
            placeholder="Например: 500мг, 1 таблетка"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Раз в день *</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(n => (
              <button key={n} type="button" onClick={() => setTimesCount(n)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  form.times_per_day === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'
                }`}>
                {n}×
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Время приёма *</label>
          <div className="space-y-2">
            {form.schedule_times.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">
                  {['Утро', 'День', 'Вечер', 'Ночь'][i]}
                </span>
                <input type="time" value={t}
                  onChange={e => setTime(i, e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">С *</label>
            <input type="date" required value={form.start_date}
              onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">По</label>
            <input type="date" value={form.end_date} min={form.start_date}
              onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-blue-400" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Заметка</label>
          <textarea value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Например: принимать после еды"
            rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none" />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-xl">{error}</div>
        )}
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50">
          {loading ? 'Сохранение...' : 'Добавить в расписание'}
        </button>
      </form>
    </Modal>
  )
}
