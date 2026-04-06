"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Неверный email или пароль");
      setLoading(false);
      return;
    }

    await supabase.auth.getSession();

    // Редирект по роли
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", data.user.id)
      .single();

    if (user?.role === "pharmacy") window.location.href = "/pharmacy/dashboard";
    else if (user?.role === "courier")
      window.location.href = "/courier/dashboard";
    else if (user?.role === "admin") window.location.href = "/admin";
    else window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-8">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">💊</span>
            <span className="font-bold text-gray-900 text-2xl">TezDavo</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Вход</h1>
          <p className="text-gray-500 text-sm mt-1">
            Доставка лекарств · Toshkent
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
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
          <p className="text-center text-sm text-gray-500 mt-4">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-blue-600 font-medium">
              Регистрация
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
