"use client";
import { useState } from "react";
import Link from "next/link";

type Step = "info" | "otp";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fullPhone = `+998${phone}`;

  // ── Шаг 1: отправить OTP ──────────────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (!name.trim()) return setError("Введите имя");
    if (phone.length < 9) return setError("Введите 9 цифр номера");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!data.ok) return setError(data.error || "Ошибка отправки кода");
      setRequestId(data.request_id);
      setStep("otp");
    } catch {
      setError("Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  };

  // ── Шаг 2: проверить OTP ──────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length < 6) return setError("Введите 6-значный код");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          code: otp,
          request_id: requestId,
          name: name.trim(),
          role: "user", // всегда покупатель
        }),
      });
      const data = await res.json();
      if (!data.ok) return setError(data.error || "Неверный код");

      const sessionRes = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        }),
      });

      if (sessionRes.ok) {
        window.location.href = "/";
      } else {
        setError("Ошибка установки сессии");
      }
    } catch {
      setError("Ошибка. Попробуйте ещё раз");
    } finally {
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
            {step === "info" ? "Регистрация" : "Введите код"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === "info"
              ? "Быстрая доставка лекарств"
              : `Код отправлен в Telegram на ${fullPhone}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {step === "info" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя *
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван Иванов"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер телефона *
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50">
                  <span className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700 border-r border-gray-200">
                    +998
                  </span>
                  <input
                    required
                    type="tel"
                    maxLength={9}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
                    }
                    placeholder="90 123 45 67"
                    className="flex-1 px-4 py-3 text-sm outline-none"
                  />
                </div>
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
                {loading ? "Отправляем код..." : "Получить код в Telegram"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex items-start gap-3 bg-blue-50 rounded-xl px-4 py-3">
                <span className="text-xl">✈️</span>
                <p className="text-sm text-blue-700">
                  Откройте Telegram — код придёт в чат{" "}
                  <strong>«Verification Codes»</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Код из Telegram
                </label>
                <input
                  required
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="123456"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold tracking-widest text-center outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
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
                {loading ? "Проверяем..." : "Зарегистрироваться"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep("info"); setOtp(""); setError(""); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Изменить номер
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading}
                  className="text-blue-600 font-medium disabled:opacity-50"
                >
                  Отправить снова
                </button>
              </div>
            </form>
          )}

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
