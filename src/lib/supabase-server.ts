from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
export function createClient() {
  const cookieStore = cookies()
  const headerStore = headers()

  // Читаем Bearer токен из заголовка (для мобильного приложения)
  const authHeader = headerStore.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
      // Если есть Bearer токен — используем его
      global: bearerToken ? {
        headers: {
          Authorization: Bearer ${bearerToken},
        },
      } : undefined,
    }
  )
}