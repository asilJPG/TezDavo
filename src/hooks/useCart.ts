'use client'
import { useEffect, useState, useCallback } from 'react'
import type { CartItem } from '@/types'
import { CONFIG } from '@/constants/config'

const CART_KEY = 'pharmauz_cart'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(CART_KEY)
    if (stored) {
      try { setItems(JSON.parse(stored)) } catch { localStorage.removeItem(CART_KEY) }
    }
  }, [])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.inventory_id === item.inventory_id)
      let updated: CartItem[]
      if (existing) {
        updated = prev.map(i => i.inventory_id === item.inventory_id ? { ...i, quantity: i.quantity + 1 } : i)
      } else {
        const base = prev.length === 0 || prev[0].pharmacy_id === item.pharmacy_id ? prev : []
        updated = [...base, { ...item, quantity: 1 }]
      }
      localStorage.setItem(CART_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeItem = useCallback((inventoryId: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.inventory_id !== inventoryId)
      localStorage.setItem(CART_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const updateQuantity = useCallback((inventoryId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(inventoryId); return }
    setItems(prev => {
      const updated = prev.map(i => i.inventory_id === inventoryId ? { ...i, quantity } : i)
      localStorage.setItem(CART_KEY, JSON.stringify(updated))
      return updated
    })
  }, [removeItem])

  const clear = useCallback(() => {
    setItems([])
    localStorage.removeItem(CART_KEY)
  }, [])

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const deliveryFee = subtotal >= CONFIG.FREE_DELIVERY_THRESHOLD ? 0 : CONFIG.DELIVERY_FEE
  const total = subtotal + deliveryFee
  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const pharmacyId = items[0]?.pharmacy_id ?? null
  const pharmacyName = items[0]?.pharmacy_name ?? null

  return { items, count, subtotal, deliveryFee, total, pharmacyId, pharmacyName, addItem, removeItem, updateQuantity, clear }
}
