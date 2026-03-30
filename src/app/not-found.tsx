import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
export default function NotFound() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Страница не найдена</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Такой страницы не существует</p>
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold">На главную</Link>
      </div>
    </AppLayout>
  )
}
