'use client'
// src/components/medicine/MedicineCard.tsx
import Link from 'next/link'
import { cn, formatPrice } from '@/lib/utils'
import type { Medicine } from '@/types'

interface MedicineCardProps {
  medicine: Medicine & { min_price?: number; pharmacy_count?: number }
  variant?: 'grid' | 'list'
}

export function MedicineCard({ medicine, variant = 'list' }: MedicineCardProps) {
  if (variant === 'grid') {
    return (
      <Link href={`/medicine/${medicine.id}`} className="block bg-white rounded-xl p-3 shadow-sm">
        <div className="bg-blue-50 rounded-lg h-16 flex items-center justify-center mb-2">
          <span className="text-3xl">💊</span>
        </div>
        <p className="font-medium text-gray-900 text-sm truncate">{medicine.name}</p>
        {medicine.manufacturer && (
          <p className="text-xs text-gray-400 truncate">{medicine.manufacturer}</p>
        )}
        {medicine.min_price && (
          <p className="text-blue-600 font-semibold text-sm mt-1">
            от {formatPrice(medicine.min_price)}
          </p>
        )}
      </Link>
    )
  }

  return (
    <Link href={`/medicine/${medicine.id}`} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
      <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-2xl">💊</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{medicine.name}</p>
        {medicine.generic_name && (
          <p className="text-xs text-gray-400 truncate">{medicine.generic_name}</p>
        )}
        <p className="text-xs text-gray-500">{medicine.category}</p>
        <div className="flex items-center gap-2 mt-1">
          {medicine.requires_prescription && (
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">Рецепт</span>
          )}
          {medicine.min_price && (
            <span className="text-blue-600 font-semibold text-sm">
              от {formatPrice(medicine.min_price)}
            </span>
          )}
          {medicine.pharmacy_count && (
            <span className="text-gray-400 text-xs">
              · {medicine.pharmacy_count} аптек
            </span>
          )}
        </div>
      </div>
      <span className="text-gray-300 text-lg flex-shrink-0">›</span>
    </Link>
  )
}
