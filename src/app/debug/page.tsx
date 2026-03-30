'use client'
// /debug — ТОЛЬКО для разработки, удали в продакшене
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function DebugPage() {
  const [info, setInfo] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    async function check() {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      let profile = null
      let profileError = null
      if (user) {
        const { data, error } = await supabase.from('users').select('*').eq('auth_id', user.id).maybeSingle()
        profile = data
        profileError = error
      }
      setInfo({ supabase_user: user ? { id: user.id, email: user.email, metadata: user.user_metadata } : null, auth_error: authError?.message ?? null, profile, profile_error: profileError?.message ?? null })
    }
    check()
  }, [])

  return (
    <div className="p-6 max-w-2xl mx-auto font-mono text-sm">
      <h1 className="text-lg font-bold mb-4">🔍 Auth Debug</h1>
      {!info && <p className="text-gray-400 animate-pulse">Проверяем...</p>}
      {info && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${info.supabase_user ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="font-bold mb-2">{info.supabase_user ? '✅ Авторизован в Supabase Auth' : '❌ НЕ авторизован в Supabase Auth'}</p>
            {info.auth_error && <p className="text-red-600 text-xs">Ошибка: {info.auth_error}</p>}
            {info.supabase_user && (
              <div className="text-xs space-y-1 mt-2 text-gray-700">
                <p><b>ID:</b> {info.supabase_user.id}</p>
                <p><b>Email:</b> {info.supabase_user.email}</p>
                <p><b>Metadata:</b> {JSON.stringify(info.supabase_user.metadata)}</p>
              </div>
            )}
          </div>

          <div className={`p-4 rounded-xl ${info.profile ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="font-bold mb-2">{info.profile ? '✅ Профиль найден в таблице users' : '❌ Профиль НЕ найден в таблице users'}</p>
            {info.profile_error && <p className="text-red-600 text-xs">Ошибка RLS: {info.profile_error}</p>}
            {info.profile && (
              <div className="text-xs space-y-1 mt-2 text-gray-700">
                <p><b>Имя:</b> {info.profile.full_name}</p>
                <p><b>Роль:</b> {info.profile.role}</p>
                <p><b>Телефон:</b> {info.profile.phone}</p>
              </div>
            )}
          </div>

          {!info.profile && info.supabase_user && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 space-y-1">
              <p className="font-bold">⚠️ Как исправить:</p>
              <p>1. Открой Supabase Dashboard → SQL Editor</p>
              <p>2. Запусти <code className="bg-yellow-100 px-1 rounded">supabase/fix_rls.sql</code></p>
              <p>3. Потом запусти INSERT из комментариев в конце файла</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
