import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'سند — Sanad',
        short_name: 'سند',
        description: 'رفيق ذكاء اصطناعي للصحة النفسية والإنتاجية — مش معالج نفسي. AI wellness companion — not a therapist.',
        dir: 'rtl',
        lang: 'ar',
        display: 'standalone',
        start_url: '/',
        background_color: '#0b1626',
        theme_color: '#0b1626',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // NEVER cache API responses — chat is streaming + personal data
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_ORIGIN || 'http://localhost:8080', changeOrigin: true },
      '/health': { target: process.env.VITE_API_ORIGIN || 'http://localhost:8080', changeOrigin: true },
    },
  },
});
