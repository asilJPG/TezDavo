"use client";
import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth, signOut } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";

const MENU = [
  {
    href: "/profile/orders",
    icon: "📦",
    label: "Мои заказы",
    desc: "Активные и история",
  },
  {
    href: "/profile/medicines",
    icon: "💊",
    label: "Мои лекарства",
    desc: "Сохранённые лекарства",
  },
  {
    href: "/profile/schedule",
    icon: "📅",
    label: "График приёма",
    desc: "Расписание и напоминания",
  },
  {
    href: "/ai-chat",
    icon: "🤖",
    label: "AI Помощник",
    desc: "Вопросы о лекарствах",
  },
];

const ROLE_LABELS: Record<string, string> = {
  user: "Покупатель",
  pharmacy: "Аптека",
  courier: "Курьер",
  admin: "Администратор",
};

function LoginForm() {
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
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", data.user.id)
      .single();
    if (user?.role === "pharmacy") window.location.href = "/pharmacy/dashboard";
    else if (user?.role === "courier")
      window.location.href = "/courier/dashboard";
    else if (user?.role === "admin") window.location.href = "/admin";
    else window.location.reload();
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
          👤
        </div>
        <h2 className="font-bold text-gray-900 text-xl">Войдите в аккаунт</h2>
        <p className="text-gray-500 text-sm mt-1">
          Чтобы видеть профиль и заказы
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
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
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50"
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
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({ full_name: user?.full_name || "", phone: user?.phone || "" });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditing(false);
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user)
    return (
      <AppLayout>
        <LoginForm />
      </AppLayout>
    );

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* User card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          {!editing ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-700 flex-shrink-0">
                {user.full_name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">
                  {user.full_name}
                </p>
                <p className="text-gray-500 text-sm">{user.phone}</p>
                {user.email && !user.email.endsWith('@tezdavo.uz') && (
                  <p className="text-gray-400 text-xs">{user.email}</p>
                )}
                <span className="inline-flex mt-1.5 bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
              <button
                onClick={startEdit}
                className="text-blue-600 text-sm font-medium flex-shrink-0"
              >
                Изменить
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Полное имя
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, full_name: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Телефон
                </label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "..." : "Сохранить"}
                </button>
              </div>
            </div>
          )}
        </div>

        {user.role === "pharmacy" && (
          <Link
            href="/pharmacy/dashboard"
            className="flex items-center gap-3 bg-blue-600 text-white p-4 rounded-xl mb-4"
          >
            <span className="text-2xl">🏪</span>
            <div>
              <p className="font-semibold">Кабинет аптеки</p>
              <p className="text-blue-200 text-xs">Заказы, склад, статистика</p>
            </div>
            <span className="ml-auto text-xl">→</span>
          </Link>
        )}
        {user.role === "courier" && (
          <Link
            href="/courier/dashboard"
            className="flex items-center gap-3 bg-green-600 text-white p-4 rounded-xl mb-4"
          >
            <span className="text-2xl">🚴</span>
            <div>
              <p className="font-semibold">Кабинет курьера</p>
              <p className="text-green-200 text-xs">Доступные заказы</p>
            </div>
            <span className="ml-auto text-xl">→</span>
          </Link>
        )}
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 bg-purple-600 text-white p-4 rounded-xl mb-4"
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="font-semibold">Админ панель</p>
              <p className="text-purple-200 text-xs">Управление платформой</p>
            </div>
            <span className="ml-auto text-xl">→</span>
          </Link>
        )}

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          {MENU.map((item, i, arr) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <span className="text-xl w-8 text-center">{item.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  {item.label}
                </p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </Link>
          ))}
        </div>

        <button
          onClick={signOut}
          className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50"
        >
          Выйти из аккаунта
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">
          TezDavo v0.1.0 · Toshkent
        </p>
      </div>
    </AppLayout>
  );
}
