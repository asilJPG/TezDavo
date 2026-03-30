export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  SEARCH: '/search',
  MEDICINE: (id: string) => `/medicine/${id}`,
  PHARMACY: (id: string) => `/pharmacy/${id}`,

  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDER: (id: string) => `/order/${id}`,

  PROFILE: '/profile',
  PROFILE_ORDERS: '/profile/orders',
  PROFILE_MEDICINES: '/profile/medicines',
  PROFILE_SCHEDULE: '/profile/schedule',

  AI_CHAT: '/ai-chat',

  PHARMACY_DASHBOARD: '/pharmacy/dashboard',
  PHARMACY_INVENTORY: '/pharmacy/inventory',
  PHARMACY_ORDERS: '/pharmacy/orders',

  COURIER_DASHBOARD: '/courier/dashboard',
  COURIER_ORDERS: '/courier/orders',

  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_PHARMACIES: '/admin/pharmacies',
  ADMIN_ORDERS: '/admin/orders',
} as const
