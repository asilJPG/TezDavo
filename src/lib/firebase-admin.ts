// src/lib/firebase-admin.ts
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let adminApp: App;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });

  return adminApp;
}

export async function sendPushNotification({
  token,
  title,
  body,
  url,
  data,
}: {
  token: string;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}) {
  try {
    const messaging = getMessaging(getAdminApp());
    await messaging.send({
      token,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
        },
        fcmOptions: { link: url || "/" },
      },
      data: data || {},
    });
  } catch (err) {
    console.error("Push notification error:", err);
  }
}

export async function sendPushToMany(
  tokens: string[],
  title: string,
  body: string,
  url?: string,
) {
  if (!tokens.length) return;
  const messaging = getMessaging(getAdminApp());
  try {
    await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        notification: { title, body, icon: "/icons/icon-192.png" },
        fcmOptions: { link: url || "/" },
      },
    });
  } catch (err) {
    console.error("Push multicast error:", err);
  }
}
