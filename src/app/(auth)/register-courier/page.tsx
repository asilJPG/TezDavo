'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RegisterCourierPage() {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '', vehicle_type: 'bicycle', vehicle_number: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({...p,[key]:e.target.value}))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const supabase = createClient()
      const { data: existing } = await supabase.from('users').select('id').eq('phone', form.phone).maybeSingle()
      if (existing) { setError('Этот номер телефона уже зарегистрирован'); setLoading(false); return }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.full_name, phone: form.phone, role: 'courier' } },
      })
      if (authError) { setError(authError.message.includes('already registered') ? 'Этот email уже зарегистрирован.' : authError.message); setLoading(false); return }
      if (!authData.user) { setError('Ошибка регистрации'); setLoading(false); return }

      const { error: pErr } = await supabase.from('users').insert({ auth_id: authData.user.id, full_name: form.full_name, phone: form.phone, email: form.email, role: 'courier' })
      if (pErr) { await supabase.auth.signOut(); setError('Ошибка создания профиля: ' + pErr.message); setLoading(false); return }

      const { data: userProfile } = await supabase.from('users').select('id').eq('auth_id', authData.user.id).single()
      if (!userProfile) { setError('Ошибка'); setLoading(false); return }

      await supabase.from('couriers').insert({ user_id: userProfile.id, vehicle_type: form.vehicle_type, vehicle_number: form.vehicle_number || null, is_available: false, is_active: true })

      window.location.href = '/courier/dashboard'
    } catch { setError('Неизвестная ошибка'); setLoading(false) }
  }

  const VEHICLES = [
    { value: 'bicycle',    label: '🚲 Велосипед' },
    { value: 'motorcycle', label: '🛵 Мотоцикл' },
    { value: 'car',        label: '🚗 Автомобиль' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-8">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">💊</span>
            <span className="font-bold text-gray-900 text-2xl">TezDavo</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Регистрация курьера</h1>
          <p className="text-gray-500 text-sm mt-1">Зарабатывайте на доставке лекарств</p>
        </div>

        {/* Role switcher */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm mb-6 flex gap-1">
          <Link href="/register"          className="flex-1 text-center text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">👤 Покупатель</Link>
          <Link href="/register-pharmacy" className="flex-1 text-center text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">🏪 Аптека</Link>
          <span className="flex-1 text-center bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold">🚴 Курьер</span>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key:'full_name', label:'ФИО *',    placeholder:'Иван Иванов',       type:'text' },
              { key:'phone',     label:'Телефон *', placeholder:'+998901234567',     type:'tel' },
              { key:'email',     label:'Email *',   placeholder:'courier@email.com', type:'email' },
              { key:'password',  label:'Пароль *',  placeholder:'Минимум 6 символов',type:'password' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input required type={f.type} minLength={f.key==='password'?6:undefined}
                  value={(form as any)[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"/>
              </div>
            ))}

            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Транспорт</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип транспорта *</label>
                <div className="grid grid-cols-3 gap-2">
                  {VEHICLES.map(v => (
                    <button key={v.value} type="button" onClick={() => setForm(p => ({...p, vehicle_type: v.value}))}
                      className={`py-3 rounded-xl text-sm border transition-colors text-center ${form.vehicle_type === v.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Номер транспорта</label>
                <input value={form.vehicle_number} onChange={set('vehicle_number')} placeholder="01 A 123 AA"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"/>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-800 mb-2">💰 Условия работы</p>
              <div className="space-y-1 text-xs text-green-700">
                <p>• 5 000 сум за каждую доставку</p>
                <p>• Свободный график, работайте когда удобно</p>
                <p>• Выплаты каждую неделю</p>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50">
              {loading ? 'Регистрируем...' : 'Стать курьером'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Уже есть аккаунт? <Link href="/login" className="text-blue-600 font-medium">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
