import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon-32.png", "apple-touch-icon.png"],
      manifest: {
        name: "ssrFacil",
        short_name: "ssrFacil",
        description:
          "Sistema de facturación y gestión para APRs (Agua Potable Rural)",
        theme_color: "#00395c",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // nunca cachear rutas de API (por si en el futuro el backend
        // llega a compartir origen con el frontend)
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
