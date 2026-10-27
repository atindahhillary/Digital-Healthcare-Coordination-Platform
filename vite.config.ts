import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // Installable PWA: every page, portal and font is precached after the first
    // visit, so the app opens instantly on slow networks and works fully offline.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "AfyaConnect",
        short_name: "AfyaConnect",
        description: "Coordinated chronic care for Kenya: specialists, labs, pharmacies and support, connected around the patient.",
        theme_color: "#0A7F73",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/app/patient",
        scope: "/",
        icons: [
          { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        // Only the Latin font subset is needed offline; the others still load on demand.
        globIgnores: ["**/inter-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese,latin-ext}-*.woff2"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Photos are cached as they are viewed rather than precached, to keep the first visit light on data.
        // A new version takes over the moment it is ready, so installed apps never sit on an old release.
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          { urlPattern: /\/img\/.*\.webp$/, handler: "CacheFirst", options: { cacheName: "photos", expiration: { maxEntries: 40 } } },
          // The explainer video and its captions are cached once watched (file names carry a version, so a new cut is a new file).
          // rangeRequests lets the video element seek and play from the cached full file while offline.
          { urlPattern: /\/video\/.*\.(mp4|vtt)$/, handler: "CacheFirst", options: { cacheName: "explainer", rangeRequests: true, cacheableResponse: { statuses: [200] }, expiration: { maxEntries: 4 } } },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: { manualChunks: { vendor: ["react", "react-dom", "react-router-dom"] } },
    },
  },
});
