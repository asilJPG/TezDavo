export const CONFIG = {
  DELIVERY_FEE: 15_000,
  FREE_DELIVERY_THRESHOLD: 200_000,
  MAX_DELIVERY_RADIUS_KM: 10,
  ORDER_POLL_INTERVAL_MS: 15_000,
  COURIER_LOCATION_INTERVAL_MS: 10_000,
  AI_MAX_HISTORY_MESSAGES: 20,
  SEARCH_DEBOUNCE_MS: 300,
  ITEMS_PER_PAGE: 20,
} as const

export const MEDICINE_CATEGORIES = [
  'Обезболивающие',
  'Антибиотики',
  'Антигистаминные',
  'Витамины',
  'Желудочно-кишечные',
  'Сердечные',
  'Спазмолитики',
  'Антисептики',
  'Противовирусные',
  'Офтальмологические',
  'Дерматологические',
  'Эндокринология',
] as const
