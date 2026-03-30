// src/app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 max-w-md mx-auto">
      <div className="text-6xl mb-4">😕</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Страница не найдена</h2>
      <p className="text-gray-500 text-sm text-center mb-6">
        Такой страницы не существует или она была удалена
      </p>
      <Link href="/" className="btn-primary">
        На главную
      </Link>
    </div>
  )
}
