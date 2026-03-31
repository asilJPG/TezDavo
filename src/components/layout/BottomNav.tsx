"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { href: "/", icon: "🏠", label: "Главная" },
  { href: "/cart", icon: "🛒", label: "Корзина", badge: true },
  { href: "/ai-chat", icon: "🤖", label: "AI Чат" },
  { href: "/profile", icon: "👤", label: "Профиль" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 pb-safe lg:hidden">
      <div className="grid grid-cols-4">
        {MOBILE_NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-1 transition-colors relative",
                active ? "text-blue-600" : "text-gray-400"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {item.badge && count > 0 && (
                <span className="absolute top-1 right-4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
