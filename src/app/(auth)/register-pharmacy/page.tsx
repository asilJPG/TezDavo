"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function RegisterPharmacyPage() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    pharmacy_name: "",
    pharmacy_address: "",
    license_number: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setError(
          authError.message.includes("already registered")
            ? "Этот email уже зарегистрирован"
            : authError.message,
        );
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Ошибка регистрации");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/register-pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_id: authData.user.id,
          full_name: form.full_name,
          phone: form.phone,
          email: form.email,
          pharmacy_name: form.pharmacy_name,
          pharmacy_address: form.pharmacy_address,
          license_number: form.license_number,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка создания профиля");
        setLoading(false);
        return;
      }

      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      window.location.href = "/pharmacy/dashboard";
    } catch {
      setError("Неизвестная ошибка");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-8">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">💊</span>
            <span className="font-bold text-gray-900 text-2xl">TezDavo</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            Регистрация аптеки
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Подключите аптеку к платформе
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Данные владельца */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Данные владельца
            </p>
            {(
              [
                {
                  key: "full_name",
                  label: "ФИО *",
                  placeholder: "Иван Иванов",
                  type: "text",
                },
                {
                  key: "phone",
                  label: "Телефон *",
                  placeholder: "+998901234567",
                  type: "tel",
                },
                {
                  key: "email",
                  label: "Email *",
                  placeholder: "aptek@email.com",
                  type: "email",
                },
                {
                  key: "password",
                  label: "Пароль *",
                  placeholder: "Минимум 6 символов",
                  type: "password",
                },
              ] as {
                key: string;
                label: string;
                placeholder: string;
                type: string;
              }[]
            ).map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}
                </label>
                <input
                  required
                  type={f.type}
                  minLength={f.key === "password" ? 6 : undefined}
                  maxLength={f.key === "phone" ? 13 : undefined}
                  value={(form as any)[f.key]}
                  onChange={(e) => {
                    const val =
                      f.key === "phone"
                        ? e.target.value.replace(/[^\d+]/g, "")
                        : e.target.value;
                    setForm((p) => ({ ...p, [f.key]: val }));
                  }}
                  placeholder={f.placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>
            ))}

            {/* Данные аптеки */}
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Данные аптеки
              </p>
              {(
                [
                  {
                    key: "pharmacy_name",
                    label: "Название аптеки *",
                    placeholder: "Аптека Здоровье",
                    type: "text",
                  },
                  {
                    key: "pharmacy_address",
                    label: "Адрес *",
                    placeholder: "ул. Амира Темура 1, Ташкент",
                    type: "text",
                  },
                  {
                    key: "license_number",
                    label: "Номер лицензии *",
                    placeholder: "ЛИЦ-12345",
                    type: "text",
                  },
                ] as {
                  key: string;
                  label: string;
                  placeholder: string;
                  type: string;
                }[]
              ).map((f) => (
                <div key={f.key} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label}
                  </label>
                  <input
                    required
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-3 rounded-xl">
              ⏳ После регистрации аптека будет отправлена на верификацию
              администратором.
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
              {loading ? "Регистрируем аптеку..." : "Зарегистрировать аптеку"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-blue-600 font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
