"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PushNotificationBanner } from "@/components/PushNotificationBanner";

const NAV = [
  { href: "/", icon: "🏠", label: "Главная" },
  { href: "/search", icon: "🔍", label: "Поиск" },
  { href: "/cart", icon: "🛒", label: "Корзина", badge: true },
  { href: "/profile/schedule", icon: "📅", label: "График приёма" },
  { href: "/ai-chat", icon: "🤖", label: "AI Помощник" },
  { href: "/profile", icon: "👤", label: "Профиль" },
];

const ROLE_NAV: Record<
  string,
  { href: string; icon: string; label: string }[]
> = {
  pharmacy: [
    { href: "/pharmacy/dashboard", icon: "🏪", label: "Кабинет аптеки" },
    { href: "/pharmacy/inventory", icon: "📦", label: "Склад" },
  ],
  courier: [
    { href: "/courier/dashboard", icon: "🚴", label: "Кабинет курьера" },
  ],
  admin: [
    { href: "/admin", icon: "⚙️", label: "Админ панель" },
    { href: "/admin/pharmacies", icon: "🏪", label: "Аптеки" },
    { href: "/admin/users", icon: "👥", label: "Пользователи" },
    { href: "/admin/orders", icon: "📦", label: "Все заказы" },
  ],
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { count } = useCart();
  const { user, loading } = useAuth();

  const roleLinks = user ? (ROLE_NAV[user.role] ?? []) : [];
  const allNav = [...NAV, ...roleLinks];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r z-40">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 px-6 py-5 border-b hover:bg-gray-50 transition-colors"
        >
          <span className="text-3xl">💊</span>
          <div>
            <span className="font-bold text-gray-900 text-xl">TezDavo</span>
            <p className="text-xs text-gray-400">Доставка лекарств</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors relative",
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <span className="text-lg w-6 text-center">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {(item as any).badge && count > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user info */}
        {loading && (
          <div className="px-4 py-4 border-t">
            <div className="flex items-center gap-3 px-2 animate-pulse">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        )}
        {!loading && user && (
          <div className="px-4 py-4 border-t">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                {user.full_name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.phone}</p>
              </div>
            </div>
          </div>
        )}
        {!loading && !user && (
          <div className="px-4 py-4 border-t space-y-2">
            <Link
              href="/login"
              className="block w-full text-center bg-blue-600 text-white text-sm py-2.5 rounded-xl font-semibold"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="block w-full text-center border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl font-medium"
            >
              Регистрация
            </Link>
          </div>
        )}
      </aside>

      {/* ── DESKTOP CONTENT ── */}
      <main className="hidden lg:block lg:ml-64 min-h-screen">{children}</main>

      {/* ── MOBILE CONTENT ── */}
      <div className="lg:hidden pb-16">{children}</div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-4">
          {[
            { href: "/", icon: "🏠", label: "Главная" },
            { href: "/cart", icon: "🛒", label: "Корзина", badge: true },
            { href: "/ai-chat", icon: "🤖", label: "AI Чат" },
            { href: "/profile", icon: "👤", label: "Профиль" },
          ].map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-2 relative transition-colors",
                  active ? "text-blue-600" : "text-gray-400",
                )}
              >
                <span className="text-xl">{item.icon}</span>
                {(item as any).badge && count > 0 && (
                  <span className="absolute top-1 right-4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {count}
                  </span>
                )}
                <span className="text-xs mt-0.5 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <PushNotificationBanner isLoggedIn={!!user} userRole={user?.role} />
    </div>
  );
}
