import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Must match your GitHub repository name EXACTLY, case-sensitive, with slashes on both sides!
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