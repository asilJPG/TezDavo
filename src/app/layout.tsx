// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'TezDavo — Tez yetkazib berish',
  description: 'Dorilar tez yetkazib berish · Toshkent',
  manifest: '/manifest.json',
  keywords: 'лекарства, аптека, доставка, Ташкент, Узбекистан',
  openGraph: {
    title: 'TezDavo',
    description: 'Доставка лекарств из аптек',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
