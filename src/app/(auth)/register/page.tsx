'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { UserRole } from '@/types'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', password: '', role: 'user' as UserRole,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      // Проверяем дубль телефона до регистрации
      const { data: existingPhone } = await supabase
        .from('users').select('id').eq('phone', form.phone).maybeSingle()
      if (existingPhone) {
        setError('Пользователь с таким телефоном уже зарегистрирован')
        setLoading(false); return
      }

      // Регистрация Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, phone: form.phone, role: form.role } },
      })

      if (authError) {
        setError(authError.message.includes('already registered')
          ? 'Пользователь с таким email уже зарегистрирован. Попробуйте войти.'
          : authError.message)
        setLoading(false); return
      }
      if (!authData.user) {
        setError('Ошибка регистрации. Попробуйте снова.')
        setLoading(false); return
      }

      // Создаём профиль
      const { error: profileError } = await supabase.from('users').insert({
        auth_id: authData.user.id,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        role: form.role,
      })

      if (profileError) {
        await supabase.auth.signOut()
        setError(profileError.message.includes('unique') || profileError.message.includes('duplicate')
          ? 'Пользователь с таким email или телефоном уже существует.'
          : 'Ошибка создания профиля: ' + profileError.message)
        setLoading(false); return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Неизвестная ошибка. Попробуйте снова.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 max-w-md mx-auto py-8">
      <div className="text-center mb-8">
        <span className="text-5xl">💊</span>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Регистрация</h1>
        <p className="text-gray-500 text-sm mt-1">Создайте аккаунт TezDavo</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Я регистрируюсь как</label>
          <div className="grid grid-cols-3 gap-2">
            {[{value:'user',label:'👤',desc:'Покупатель'},{value:'pharmacy',label:'🏪',desc:'Аптека'},{value:'courier',label:'🚴',desc:'Курьер'}].map(r => (
              <button key={r.value} type="button"
                onClick={() => setForm(p => ({ ...p, role: r.value as UserRole }))}
                className={`py-3 px-2 rounded-xl text-center border transition-colors ${form.role === r.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                <div className="text-xl mb-0.5">{r.label}</div>
                <div className="text-xs font-medium">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          {[
            {label:'Полное имя *', key:'full_name', placeholder:'Иван Иванов', type:'text'},
            {label:'Телефон *', key:'phone', placeholder:'+998901234567', type:'tel'},
            {label:'Email *', key:'email', placeholder:'your@email.com', type:'email'},
            {label:'Пароль *', key:'password', placeholder:'Минимум 6 символов', type:'password'},
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input required type={f.type} minLength={f.key==='password'?6:undefined}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
            </div>
          ))}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50">
            {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Уже есть аккаунт? <Link href="/login" className="text-blue-600 font-medium">Войти</Link>
        </p>
      </div>
    </div>
  )
}
