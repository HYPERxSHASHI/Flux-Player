import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // 1. MUST have slashes on both sides for GitHub Pages subdirectory routing
  base: '/Flux-Player/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Flux Player',
        short_name: 'Flux',
        description: 'Premium Offline Music Player',
        theme_color: '#e0ecef',
        icons: [
          {
            // 2. Dropped the leading slash so the app finds the icon inside the subfolder
            src: 'ICON.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'ICON.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})