// Generate the worker with the same public Firebase config as the client build.
export const dynamic = "force-static"

export function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  const script = `
self.addEventListener("notificationclick", (event) => {
  if (!event.notification.data?.FCM_MSG) return;
  event.stopImmediatePropagation();
  event.notification.close();
  // A notice may name its page (a sale opens the income to write down); same site only.
  const path = event.notification.data.FCM_MSG.data?.url;
  const url = new URL(typeof path === "string" && path.startsWith("/") && !path.startsWith("//") ? path : "/transactions", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(url);
      return existing.focus();
    }
    return self.clients.openWindow(url);
  })());
});
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");
firebase.initializeApp(${JSON.stringify(config)});
firebase.messaging();
// Notification payloads are displayed by FCM; do not show a second notification.
`

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
