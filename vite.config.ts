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
        name: "Unganisha Care",
        short_name: "Unganisha",
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
        runtimeCaching: [{ urlPattern: /\/img\/.*\.webp$/, handler: "CacheFirst", options: { cacheName: "photos", expiration: { maxEntries: 40 } } }],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: { manualChunks: { vendor: ["react", "react-dom", "react-router-dom"] } },
    },
  },
});
