import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Flux-Player/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true
      },
      manifest: {
        id: '/Flux-Player/', // Uniquely identifies your app installation path
        name: 'Flux Player',
        short_name: 'Flux',
        description: 'Premium Offline Audio and Music Player with Advanced Controls.',
        lang: 'en-US', // Explicitly tells app stores the primary language
        start_url: '/Flux-Player/',
        theme_color: '#121212', // Rich dark theme color matching your UI
        background_color: '#121212', // Seamless launch screen color background
        display: 'standalone',
        orientation: 'portrait',
        categories: ['music', 'utilities'],
        icons: [
          {
            src: 'ICON.png', 
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'ICON.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable' // Explicit separate allocation for Android shape systems
          },
          {
            src: 'ICON.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'ICON.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
})