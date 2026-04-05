"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Tab = "phone" | "email";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("phone");

  // ── Email ──────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Телефон / OTP ──────────────────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fullPhone = `+998${phone}`;

  // ── Вход по email ──────────────────────────────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError("Неверный email или пароль"); return; }

      const { data: user } = await supabase
        .from("users").select("role").eq("auth_id", data.user.id).single();

      if (user?.role === "pharmacy") window.location.href = "/pharmacy/dashboard";
      else if (user?.role === "courier") window.location.href = "/courier/dashboard";
      else if (user?.role === "admin") window.location.href = "/admin";
      else window.location.href = "/";
    } catch {
      setError("Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  // ── Отправить OTP ──────────────────────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (phone.length < 9) { setError("Введите 9 цифр номера"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, mode: 'login' }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Ошибка отправки кода"); return; }
      setRequestId(data.request_id);
      setOtpSent(true);
    } catch {
      setError("Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  };

  // ── Проверить OTP ──────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length < 6) { setError("Введите 6-значный код"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code: otp, request_id: requestId }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Неверный код"); return; }

      const sessionRes = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        }),
      });

      if (sessionRes.ok) {
        const role = data.role;
        if (role === "pharmacy") window.location.href = "/pharmacy/dashboard";
        else if (role === "courier") window.location.href = "/courier/dashboard";
        else window.location.href = "/";
      } else {
        setError("Ошибка входа");
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
          <h1 className="text-xl font-bold text-gray-900">Вход</h1>
          <p className="text-gray-500 text-sm mt-1">Доставка лекарств · Toshkent</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {/* Табы */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(["phone", "email"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); setOtpSent(false); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {t === "phone" ? "📱 Телефон" : "✉️ Email"}
              </button>
            ))}
          </div>

          {tab === "phone" ? (
            // ── Телефон ────────────────────────────────────────────────────
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер телефона
                </label>
                <div className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-50 ${
                  otpSent ? "bg-gray-50 border-gray-100" : "border-gray-200 focus-within:border-blue-400"
                }`}>
                  <span className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700 border-r border-gray-200">
                    +998
                  </span>
                  <input
                    type="tel"
                    maxLength={9}
                    value={phone}
                    disabled={otpSent}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="90 123 45 67"
                    className="flex-1 px-4 py-3 text-sm outline-none bg-transparent disabled:text-gray-400"
                  />
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
                      className="px-3 text-blue-600 text-sm font-medium"
                    >
                      Изменить
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <>
                  <div className="flex items-start gap-3 bg-blue-50 rounded-xl px-4 py-3">
                    <span className="text-lg">✈️</span>
                    <p className="text-sm text-blue-700">
                      Откройте Telegram — код придёт в чат <strong>«Verification Codes»</strong>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Код из Telegram
                    </label>
                    <input
                      type="number"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                      placeholder="123456"
                      autoFocus
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold tracking-widest text-center outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="text-sm text-blue-600 mt-2 disabled:opacity-50"
                    >
                      Отправить снова
                    </button>
                  </div>
                </>
              )}

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
                {loading
                  ? "Загрузка..."
                  : otpSent
                  ? "Войти"
                  : "Получить код в Telegram"}
              </button>
            </form>
          ) : (
            // ── Email ──────────────────────────────────────────────────────
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              <button
                type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50"
              >
                {loading ? "Входим..." : "Войти"}
              </button>
            </form>
          )}

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
