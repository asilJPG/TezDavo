# TezDavo — Полная структура проекта

```
tezdavo/
│
├── 📄 package.json
├── 📄 next.config.js
├── 📄 tailwind.config.ts
├── 📄 tsconfig.json
├── 📄 .env.local
├── 📄 .env.example
├── 📄 .gitignore
├── 📄 middleware.ts                    ← защита роутов
│
├── 📁 supabase/
│   ├── 📄 schema.sql                  ← основная схема БД
│   ├── 📄 seed.sql                    ← тестовые данные
│   └── 📄 rls.sql                     ← все RLS политики
│
├── 📁 public/
│   ├── 📄 manifest.json               ← PWA манифест
│   ├── 🖼 logo.svg
│   └── 🖼 favicon.ico
│
└── 📁 src/
    │
    ├── 📁 app/                         ← Next.js App Router
    │   │
    │   ├── 📄 layout.tsx               ← корневой layout
    │   ├── 📄 globals.css
    │   ├── 📄 not-found.tsx
    │   ├── 📄 loading.tsx
    │   │
    │   ├── 📄 page.tsx                 ← / Главная
    │   │
    │   ├── 📁 (auth)/                  ← группа без layout
    │   │   ├── 📁 login/
    │   │   │   └── 📄 page.tsx         ← /login
    │   │   ├── 📁 register/
    │   │   │   └── 📄 page.tsx         ← /register
    │   │   └── 📄 layout.tsx
    │   │
    │   ├── 📁 search/
    │   │   ├── 📄 page.tsx             ← /search?q=...
    │   │   └── 📄 loading.tsx
    │   │
    │   ├── 📁 medicine/
    │   │   └── 📁 [id]/
    │   │       ├── 📄 page.tsx         ← /medicine/[id]
    │   │       └── 📄 loading.tsx
    │   │
    │   ├── 📁 pharmacy/
    │   │   ├── 📁 [id]/
    │   │   │   └── 📄 page.tsx         ← /pharmacy/[id] публичный профиль
    │   │   ├── 📁 dashboard/
    │   │   │   └── 📄 page.tsx         ← /pharmacy/dashboard
    │   │   ├── 📁 inventory/
    │   │   │   └── 📄 page.tsx         ← /pharmacy/inventory
    │   │   ├── 📁 orders/
    │   │   │   └── 📄 page.tsx         ← /pharmacy/orders
    │   │   └── 📄 layout.tsx           ← layout аптеки (guard)
    │   │
    │   ├── 📁 courier/
    │   │   ├── 📁 dashboard/
    │   │   │   └── 📄 page.tsx         ← /courier/dashboard
    │   │   ├── 📁 orders/
    │   │   │   └── 📄 page.tsx         ← /courier/orders история
    │   │   └── 📄 layout.tsx
    │   │
    │   ├── 📁 admin/
    │   │   ├── 📄 page.tsx             ← /admin дашборд
    │   │   ├── 📁 users/
    │   │   │   └── 📄 page.tsx
    │   │   ├── 📁 pharmacies/
    │   │   │   └── 📄 page.tsx
    │   │   ├── 📁 orders/
    │   │   │   └── 📄 page.tsx
    │   │   └── 📄 layout.tsx
    │   │
    │   ├── 📁 cart/
    │   │   └── 📄 page.tsx             ← /cart
    │   │
    │   ├── 📁 checkout/
    │   │   └── 📄 page.tsx             ← /checkout
    │   │
    │   ├── 📁 order/
    │   │   └── 📁 [id]/
    │   │       └── 📄 page.tsx         ← /order/[id] трекинг
    │   │
    │   ├── 📁 profile/
    │   │   ├── 📄 page.tsx             ← /profile
    │   │   ├── 📁 orders/
    │   │   │   └── 📄 page.tsx         ← /profile/orders история
    │   │   ├── 📁 medicines/
    │   │   │   └── 📄 page.tsx         ← /profile/medicines мои лекарства
    │   │   ├── 📁 schedule/
    │   │   │   └── 📄 page.tsx         ← /profile/schedule
    │   │   └── 📄 layout.tsx
    │   │
    │   ├── 📁 ai-chat/
    │   │   └── 📄 page.tsx             ← /ai-chat
    │   │
    │   └── 📁 api/                     ← API Routes
    │       ├── 📁 auth/
    │       │   ├── 📁 register/
    │       │   │   └── 📄 route.ts
    │       │   ├── 📁 me/
    │       │   │   └── 📄 route.ts
    │       │   └── 📁 callback/
    │       │       └── 📄 route.ts     ← Supabase OAuth callback
    │       │
    │       ├── 📁 medicines/
    │       │   ├── 📄 route.ts         ← GET /api/medicines
    │       │   └── 📁 [id]/
    │       │       └── 📄 route.ts     ← GET /api/medicines/:id
    │       │
    │       ├── 📁 pharmacies/
    │       │   ├── 📄 route.ts
    │       │   └── 📁 [id]/
    │       │       ├── 📄 route.ts
    │       │       └── 📁 inventory/
    │       │           └── 📄 route.ts
    │       │
    │       ├── 📁 orders/
    │       │   ├── 📄 route.ts         ← GET, POST
    │       │   └── 📁 [id]/
    │       │       ├── 📄 route.ts     ← GET
    │       │       └── 📁 status/
    │       │           └── 📄 route.ts ← PATCH
    │       │
    │       ├── 📁 schedule/
    │       │   ├── 📄 route.ts         ← GET, POST
    │       │   └── 📁 [id]/
    │       │       ├── 📄 route.ts     ← PUT, DELETE
    │       │       └── 📁 log/
    │       │           └── 📄 route.ts ← POST отметить приём
    │       │
    │       ├── 📁 couriers/
    │       │   └── 📁 location/
    │       │       └── 📄 route.ts     ← PATCH обновить геолокацию
    │       │
    │       └── 📁 ai-chat/
    │           └── 📄 route.ts
    │
    ├── 📁 components/
    │   │
    │   ├── 📁 ui/                      ← базовые переиспользуемые
    │   │   ├── 📄 Button.tsx
    │   │   ├── 📄 Input.tsx
    │   │   ├── 📄 Textarea.tsx
    │   │   ├── 📄 Badge.tsx
    │   │   ├── 📄 Card.tsx
    │   │   ├── 📄 Modal.tsx
    │   │   ├── 📄 Spinner.tsx
    │   │   ├── 📄 Avatar.tsx
    │   │   └── 📄 index.ts             ← barrel export
    │   │
    │   ├── 📁 layout/
    │   │   ├── 📄 Navbar.tsx           ← верхняя навбар
    │   │   ├── 📄 BottomNav.tsx        ← нижняя навигация (mobile)
    │   │   ├── 📄 Sidebar.tsx          ← боковое меню (desktop)
    │   │   └── 📄 PageHeader.tsx       ← шапка страницы с кнопкой назад
    │   │
    │   ├── 📁 medicine/
    │   │   ├── 📄 MedicineCard.tsx     ← карточка в списке
    │   │   ├── 📄 MedicineSearch.tsx   ← поисковая строка
    │   │   ├── 📄 PriceRow.tsx         ← строка цены аптеки
    │   │   ├── 📄 PriceComparison.tsx  ← список цен
    │   │   └── 📄 CategoryFilter.tsx   ← фильтр категорий
    │   │
    │   ├── 📁 pharmacy/
    │   │   ├── 📄 PharmacyCard.tsx     ← карточка аптеки
    │   │   ├── 📄 PharmacyMap.tsx      ← карта с аптеками
    │   │   └── 📄 InventoryTable.tsx   ← таблица склада
    │   │
    │   ├── 📁 order/
    │   │   ├── 📄 CartItem.tsx         ← элемент корзины
    │   │   ├── 📄 OrderCard.tsx        ← карточка заказа
    │   │   ├── 📄 OrderStatus.tsx      ← бейдж статуса
    │   │   ├── 📄 OrderTracker.tsx     ← прогресс доставки
    │   │   └── 📄 DeliveryMap.tsx      ← карта доставки
    │   │
    │   ├── 📁 schedule/
    │   │   ├── 📄 ScheduleForm.tsx     ← форма добавления
    │   │   ├── 📄 ScheduleCard.tsx     ← карточка расписания
    │   │   ├── 📄 ScheduleList.tsx     ← список всех расписаний
    │   │   ├── 📄 TodaySchedule.tsx    ← приём на сегодня
    │   │   └── 📄 DoseRow.tsx          ← строка приёма (с кнопкой ✓)
    │   │
    │   ├── 📁 ai/
    │   │   ├── 📄 ChatMessage.tsx      ← одно сообщение
    │   │   ├── 📄 ChatInput.tsx        ← поле ввода
    │   │   └── 📄 QuickQuestions.tsx   ← быстрые вопросы
    │   │
    │   └── 📁 auth/
    │       ├── 📄 LoginForm.tsx
    │       └── 📄 RegisterForm.tsx
    │
    ├── 📁 lib/
    │   ├── 📄 supabase.ts              ← browser client
    │   ├── 📄 supabase-server.ts       ← server client
    │   ├── 📄 ai.ts                    ← Anthropic helper
    │   ├── 📄 maps.ts                  ← Google Maps helper
    │   └── 📄 utils.ts                 ← форматирование, хелперы
    │
    ├── 📁 hooks/
    │   ├── 📄 useCart.ts               ← корзина (localStorage)
    │   ├── 📄 useAuth.ts               ← текущий пользователь
    │   ├── 📄 useGeolocation.ts        ← геолокация браузера
    │   ├── 📄 useSchedule.ts           ← расписание приёма
    │   └── 📄 useOrders.ts             ← заказы
    │
    ├── 📁 store/
    │   ├── 📄 cartStore.ts             ← Zustand: корзина
    │   └── 📄 authStore.ts             ← Zustand: авторизация
    │
    ├── 📁 types/
    │   └── 📄 index.ts                 ← все TypeScript типы
    │
    └── 📁 constants/
        ├── 📄 routes.ts                ← все пути приложения
        └── 📄 config.ts                ← настройки (delivery fee и т.д.)
```
