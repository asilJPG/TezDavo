"use client";
// src/components/layout/CourierLayout.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, signOut } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const COURIER_NAV = [
  { href: "/courier/dashboard", icon: "🚴", label: "Заказы" },
  { href: "/courier/profile", icon: "👤", label: "Профиль" },
];

export function CourierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Загрузка...</div>
      </div>
    );
  }

  if (!user || user.role !== "courier") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <p className="text-gray-700 font-semibold mb-1">
            Доступ только для курьеров
          </p>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold mt-3 inline-block"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r z-40">
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <span className="text-3xl">🚴</span>
          <div>
            <span className="font-bold text-gray-900 text-lg">TezDavo</span>
            <p className="text-xs text-gray-400">Кабинет курьера</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {COURIER_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <span className="text-lg w-6 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-orange-700">
              {user.full_name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-gray-400">Курьер</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full text-center border border-red-200 text-red-600 text-sm py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Desktop content */}
      <main className="hidden lg:block lg:ml-64 min-h-screen">{children}</main>

      {/* Mobile content */}
      <div className="lg:hidden pb-16">{children}</div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-2">
          <Link
            href="/courier/dashboard"
            className={cn(
              "flex flex-col items-center py-2 transition-colors",
              pathname === "/courier/dashboard"
                ? "text-blue-600"
                : "text-gray-400",
            )}
          >
            <span className="text-xl">🚴</span>
            <span className="text-xs mt-0.5 font-medium">Заказы</span>
          </Link>
          <Link
            href="/courier/profile"
            className={cn(
              "flex flex-col items-center py-2 transition-colors",
              pathname === "/courier/profile"
                ? "text-blue-600"
                : "text-gray-400",
            )}
          >
            <span className="text-xl">👤</span>
            <span className="text-xs mt-0.5 font-medium">Профиль</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
