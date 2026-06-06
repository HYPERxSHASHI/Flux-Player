import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Flux-Player/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline', // 👈 Crucial: Automatically registers the service worker
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'] // Caches all your app files for offline use
      },
      manifest: {
        name: 'Flux Player',
        short_name: 'Flux',
        description: 'Premium Offline Music Player',
        theme_color: '#e0ecef',
        background_color: '#e0ecef',
        display: 'standalone', // 👈 Crucial: Makes it open like a real mobile app without a browser bar
        orientation: 'portrait',
        icons: [
          {
            src: 'ICON.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable' // 👈 Crucial: Fits perfectly on Android round/square shapes
          },
          {
            src: 'ICON.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})