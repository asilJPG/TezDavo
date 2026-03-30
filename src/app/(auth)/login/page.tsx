"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Неверный email или пароль");
      setLoading(false);
      return;
    }

    // Ждём пока сессия точно запишется в куки
    await supabase.auth.getSession();

    // Используем window.location вместо router.push — полный перезапуск
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-8">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">💊</span>
            <span className="font-bold text-gray-900 text-2xl">TezDavo</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Вход в аккаунт</h1>
          <p className="text-gray-500 text-sm mt-1">
            Доставка лекарств · Toshkent
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50"
            >
              {loading ? "Входим..." : "Войти"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 text-center mb-3">
            Нет аккаунта? Зарегистрируйтесь как:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/register"
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="text-xl">👤</span>
              <span className="text-xs text-gray-600 font-medium">
                Покупатель
              </span>
            </Link>
            <Link
              href="/register-pharmacy"
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="text-xl">🏪</span>
              <span className="text-xs text-gray-600 font-medium">Аптека</span>
            </Link>
            <Link
              href="/register-courier"
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="text-xl">🚴</span>
              <span className="text-xs text-gray-600 font-medium">Курьер</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
