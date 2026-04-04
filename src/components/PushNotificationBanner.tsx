"use client";
// src/components/PushNotificationBanner.tsx
import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Props {
  isLoggedIn: boolean;
  userRole?: string;
}

export function PushNotificationBanner({ isLoggedIn, userRole }: Props) {
  const { permission, requestPermission } = usePushNotifications(isLoggedIn);
  const [dismissed, setDismissed] = useState(true); // по умолчанию скрыт
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Читаем из localStorage только на клиенте
    const saved = localStorage.getItem("push_banner_dismissed");
    if (!saved) setDismissed(false);
  }, []);

  if (!isLoggedIn || userRole !== "user") return null;
  if (permission === "granted") return null;
  if (permission === "denied") return null;
  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("push_banner_dismissed", "1");
    setDismissed(true);
  };

  const handleRequest = async () => {
    setLoading(true);
    await requestPermission();
    setLoading(false);
    handleDismiss();
  };

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-40">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🔔</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">
            Включить уведомления
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Узнавайте когда заказ подтверждён и курьер в пути
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-xl"
            >
              Не сейчас
            </button>
            <button
              onClick={handleRequest}
              disabled={loading}
              className="flex-1 py-1.5 text-xs text-white bg-blue-600 rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? "..." : "Включить"}
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-gray-300 text-lg">
          ×
        </button>
      </div>
    </div>
  );
}
