// src/types/index.ts

export type UserRole = 'user' | 'pharmacy' | 'courier' | 'admin'

export type OrderStatus =
  | 'created'
  | 'pharmacy_confirmed'
  | 'courier_assigned'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'

export type DosageForm = 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'drops' | 'spray' | 'other'

export interface User {
  id: string
  auth_id: string
  full_name: string
  phone: string
  email?: string
  role: UserRole
  address?: string
  lat?: number
  lng?: number
  avatar_url?: string
  created_at: string
}

export interface Pharmacy {
  id: string
  user_id: string
  name: string
  description?: string
  address: string
  lat: number
  lng: number
  phone: string
  license_number: string
  working_hours: { mon_fri: string; sat_sun: string }
  logo_url?: string
  is_verified: boolean
  is_active: boolean
  rating: number
  review_count: number
  created_at: string
  distance?: number // computed on client
}

export interface Medicine {
  id: string
  name: string
  generic_name?: string
  manufacturer?: string
  category: string
  dosage_form?: DosageForm
  dosage_strength?: string
  description?: string
  instructions?: string
  side_effects?: string
  contraindications?: string
  image_url?: string
  requires_prescription: boolean
}

export interface PharmacyInventory {
  id: string
  pharmacy_id: string
  medicine_id: string
  quantity: number
  price: number
  in_stock: boolean
  updated_at: string
  pharmacy?: Pharmacy
  medicine?: Medicine
}

export interface MedicineWithPrices extends Medicine {
  prices: {
    pharmacy: Pharmacy
    inventory_id: string
    price: number
    quantity: number
    in_stock: boolean
  }[]
}

export interface CartItem {
  inventory_id: string
  medicine_id: string
  pharmacy_id: string
  pharmacy_name: string
  medicine_name: string
  price: number
  quantity: number
  image_url?: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  pharmacy_id: string
  courier_id?: string
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  total_amount: number
  delivery_address: string
  delivery_lat?: number
  delivery_lng?: number
  notes?: string
  cancelled_reason?: string
  created_at: string
  confirmed_at?: string
  assigned_at?: string
  picked_up_at?: string
  delivered_at?: string
  pharmacy?: Pharmacy
  items?: OrderItem[]
  courier?: User
}

export interface OrderItem {
  id: string
  order_id: string
  inventory_id: string
  medicine_id: string
  medicine_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface MedicationSchedule {
  id: string
  user_id: string
  medicine_name: string
  dosage: string
  times_per_day: number
  schedule_times: string[] // ["08:00", "14:00", "20:00"]
  start_date: string
  end_date?: string
  notes?: string
  is_active: boolean
  created_at: string
}

export interface ScheduleLog {
  id: string
  schedule_id: string
  user_id: string
  scheduled_time: string
  taken_at?: string
  status: 'pending' | 'taken' | 'skipped'
  date: string
}

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

// Order status labels in Russian
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  created: 'Заказ создан',
  pharmacy_confirmed: 'Подтверждён аптекой',
  courier_assigned: 'Курьер назначен',
  picked_up: 'Курьер забрал',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  created: 'bg-blue-100 text-blue-800',
  pharmacy_confirmed: 'bg-yellow-100 text-yellow-800',
  courier_assigned: 'bg-orange-100 text-orange-800',
  picked_up: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

// Format price in UZS
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}
