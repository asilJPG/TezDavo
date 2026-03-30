# TezDavo — Структура проекта

```
tezdavo/
├── supabase/
│   ├── schema.sql              # Полная SQL схема
│   └── seed.sql                # Тестовые данные
│
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── (user)/
│   │   │   ├── page.tsx                    # Главная
│   │   │   ├── search/page.tsx             # Поиск лекарств
│   │   │   ├── medicine/[id]/page.tsx      # Страница лекарства
│   │   │   ├── pharmacy/[id]/page.tsx      # Страница аптеки
│   │   │   ├── cart/page.tsx               # Корзина
│   │   │   ├── checkout/page.tsx           # Оформление заказа
│   │   │   ├── order/[id]/page.tsx         # Отслеживание заказа
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx                # Кабинет пользователя
│   │   │   │   ├── orders/page.tsx         # История заказов
│   │   │   │   ├── medicines/page.tsx      # Мои лекарства
│   │   │   │   └── schedule/page.tsx       # График приёма
│   │   │   └── ai-chat/page.tsx            # AI помощник
│   │   │
│   │   ├── pharmacy/
│   │   │   ├── dashboard/page.tsx          # Кабинет аптеки
│   │   │   ├── inventory/page.tsx          # Склад
│   │   │   └── orders/page.tsx             # Заказы аптеки
│   │   │
│   │   ├── courier/
│   │   │   ├── dashboard/page.tsx          # Кабинет курьера
│   │   │   └── orders/page.tsx             # Доступные заказы
│   │   │
│   │   ├── admin/
│   │   │   ├── page.tsx                    # Дашборд
│   │   │   ├── users/page.tsx
│   │   │   ├── pharmacies/page.tsx
│   │   │   └── orders/page.tsx
│   │   │
│   │   └── api/                            # API Routes
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   └── me/route.ts
│   │       ├── medicines/
│   │       │   ├── route.ts                # GET /api/medicines?q=...
│   │       │   └── [id]/route.ts
│   │       ├── pharmacies/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── inventory/route.ts
│   │       ├── orders/
│   │       │   ├── route.ts                # POST создать заказ
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── status/route.ts     # PATCH обновить статус
│   │       ├── schedule/
│   │       │   ├── route.ts                # GET, POST
│   │       │   └── [id]/route.ts           # PUT, DELETE
│   │       └── ai-chat/
│   │           └── route.ts                # POST сообщение к AI
│   │
│   ├── components/
│   │   ├── ui/                     # Базовые UI компоненты
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Modal.tsx
│   │   ├── medicine/
│   │   │   ├── MedicineCard.tsx
│   │   │   ├── MedicineSearch.tsx
│   │   │   └── PriceComparison.tsx
│   │   ├── pharmacy/
│   │   │   ├── PharmacyCard.tsx
│   │   │   └── PharmacyMap.tsx
│   │   ├── order/
│   │   │   ├── Cart.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   └── OrderTracker.tsx
│   │   ├── schedule/
│   │   │   ├── ScheduleForm.tsx
│   │   │   ├── ScheduleList.tsx
│   │   │   └── ScheduleCalendar.tsx
│   │   ├── ai/
│   │   │   └── AiChat.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       ├── BottomNav.tsx          # Mobile bottom nav
│   │       └── Sidebar.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client
│   │   ├── supabase-server.ts        # Server-side client
│   │   ├── ai.ts                     # AI chat helper
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── useCart.ts
│   │   ├── useGeolocation.ts
│   │   └── useSchedule.ts
│   │
│   └── types/
│       └── index.ts                  # TypeScript типы
│
├── .env.local                        # Переменные окружения
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Переменные окружения (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_maps_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## API Endpoints

### Лекарства
- `GET  /api/medicines?q=парацетамол&category=...`     — поиск
- `GET  /api/medicines/:id`                            — детали + аптеки с ценами

### Аптеки
- `GET  /api/pharmacies?lat=...&lng=...&radius=5000`   — ближайшие аптеки
- `GET  /api/pharmacies/:id`                           — профиль аптеки
- `GET  /api/pharmacies/:id/inventory`                 — склад аптеки

### Заказы
- `POST /api/orders`                                   — создать заказ
- `GET  /api/orders?user_id=...`                       — мои заказы
- `GET  /api/orders/:id`                               — детали заказа
- `PATCH /api/orders/:id/status`                       — обновить статус

### График приёма
- `GET  /api/schedule`                                 — мои расписания
- `POST /api/schedule`                                 — добавить лекарство
- `PUT  /api/schedule/:id`                             — редактировать
- `DELETE /api/schedule/:id`                           — удалить
- `POST /api/schedule/:id/log`                         — отметить приём

### AI Чат
- `POST /api/ai-chat`                                  — отправить сообщение
  body: `{ message: string, history: Message[] }`
