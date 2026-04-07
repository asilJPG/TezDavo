"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

declare global {
  interface Window {
    google: any;
    initGoogleMap: () => void;
  }
}

let mapsLoaded = false;
let mapsLoading = false;
const mapsCallbacks: (() => void)[] = [];

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if ((window as any).google?.maps?.places) {
      resolve();
      return;
    }
    if (mapsLoaded) {
      resolve();
      return;
    }
    mapsCallbacks.push(resolve);
    if (mapsLoading) {
      // Скрипт уже загружается — ждём
      const check = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      mapsLoading = true;
      const check = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearInterval(check);
          mapsLoaded = true;
          mapsLoading = false;
          mapsCallbacks.forEach((cb) => cb());
          mapsCallbacks.length = 0;
        }
      }, 100);
      return;
    }
    mapsLoading = true;
    window.initGoogleMap = () => {
      mapsLoaded = true;
      mapsLoading = false;
      mapsCallbacks.forEach((cb) => cb());
      mapsCallbacks.length = 0;
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=routes,marker,places&v=weekly&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;
    if (!apiKey) return;
    loadGoogleMaps(apiKey).then(() => {
      if (!addressInputRef.current) return;
      const tashkentBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(41.1, 69.1),
        new window.google.maps.LatLng(41.5, 69.5),
      );
      const autocomplete = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          bounds: tashkentBounds,
          strictBounds: false,
          fields: ["formatted_address", "geometry"],
        },
      );
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;
        setForm((p) => ({
          ...p,
          pharmacy_address: place.formatted_address || "",
        }));
        setCoords({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      });
    });
  }, []);

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

      if (!coords) {
        setError("Выберите адрес из подсказок Google Maps");
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
          lat: coords.lat,
          lng: coords.lng,
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
    <div
      className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-8"
      style={{ overflow: "visible" }}
    >
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

        <div
          className="bg-white rounded-2xl p-6 shadow-sm"
          style={{ overflow: "visible" }}
        >
          <form
            onSubmit={handleSubmit}
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest(".pac-container")) e.preventDefault();
            }}
            className="space-y-4"
          >
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
                    isAddress: true,
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
                  isAddress?: boolean;
                }[]
              ).map((f) => (
                <div key={f.key} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label}
                  </label>
                  {f.isAddress ? (
                    <div>
                      <input
                        required
                        ref={addressInputRef}
                        type="text"
                        value={form.pharmacy_address}
                        onChange={(e) => {
                          setForm((p) => ({
                            ...p,
                            pharmacy_address: e.target.value,
                          }));
                          setCoords(null);
                        }}
                        placeholder={f.placeholder}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                      />
                      {coords && (
                        <p className="text-green-600 text-xs mt-1 font-medium">
                          ✓ координаты получены
                        </p>
                      )}
                      {!coords && form.pharmacy_address && (
                        <p className="text-amber-500 text-xs mt-1">
                          Выберите адрес из подсказок
                        </p>
                      )}
                    </div>
                  ) : (
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
                  )}
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
