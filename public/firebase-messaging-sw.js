// public/firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyAfpScfOQ7H2a80Qkm08zP1Qk48UaLc6IM",
  authDomain: "tezdavo-1ab60.firebaseapp.com",
  projectId: "tezdavo-1ab60",
  storageBucket: "tezdavo-1ab60.firebasestorage.app",
  messagingSenderId: "1022950278539",
  appId: "1:1022950278539:web:81435f659f041070151b8e",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || "TezDavo", {
    body: body || "",
    icon: icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload.data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
