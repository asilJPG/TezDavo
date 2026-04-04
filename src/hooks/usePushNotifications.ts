"use client";
// src/hooks/usePushNotifications.ts
import { useEffect, useState } from "react";
import {
  requestNotificationPermission,
  onForegroundMessage,
} from "@/lib/firebase";

export function usePushNotifications(isLoggedIn: boolean) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (
        title &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(title, { body, icon: "/icons/icon-192.png" });
      }
    });
    return () => unsubscribe();
  }, [isLoggedIn]);

  const requestPermission = async () => {
    if (!isLoggedIn) return false;
    const token = await requestNotificationPermission();
    if (!token) return false;
    await fetch("/api/push/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setPermission("granted");
    return true;
  };

  return { permission, requestPermission };
}
