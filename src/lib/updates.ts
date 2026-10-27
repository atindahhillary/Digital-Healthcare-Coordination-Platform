import { registerSW } from "virtual:pwa-register";

// Installed apps stay alive for days and open from the device's own copy, so without this a new release
// would only show up one launch late. The service worker is set to take over the moment a new version
// is ready (see vite.config.ts); here we simply go and look for one at the moments that matter:
// when the app opens, when it comes back to the foreground, and when the connection returns.
// We never ask while someone is typing, so a form is not lost to a reload.
export function keepAppUpdated() {
  if (!("serviceWorker" in navigator)) return;
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const typing = () => {
        const a = document.activeElement;
        return a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement || a instanceof HTMLSelectElement;
      };
      const look = () => {
        if (!navigator.onLine || typing()) return;
        registration.update().catch(() => undefined);
      };
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") look(); });
      window.addEventListener("online", look);
      window.setInterval(look, 30 * 60 * 1000);
    },
  });
}
