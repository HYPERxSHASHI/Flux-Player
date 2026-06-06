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
        cleanupOutdatedCaches: true,
        navigateFallback: '/Flux-Player/index.html'
      },
      manifest: {
        id: '/Flux-Player/',
        name: 'Flux Player',
        short_name: 'Flux',
        description: 'Premium Offline Audio and Music Player with Advanced Controls.',
        lang: 'en-US',
        start_url: '/Flux-Player/',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait',
        categories: ['music', 'utilities'],
        
        // --- Added Play Store Compliance Screenshots ---
        screenshots: [
          {
            src: 'ICON.png', // Uses your current active asset path placeholder
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow', // Flags it as a mobile screen layout
            label: 'Flux Player Home Screen'
          },
          {
            src: 'ICON.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide', // Flags it as a desktop/tablet screen layout
            label: 'Flux Player Audio Dashboard'
          }
        ],

        shortcuts: [
          {
            name: 'Play Favorites',
            short_name: 'Favorites',
            description: 'Jump straight to your favorite music playlist',
            url: '/Flux-Player/?shortcut=favorites',
            icons: [{ src: 'ICON.png', sizes: '192x192' }]
          },
          {
            name: 'Recent Tracks',
            short_name: 'Recent',
            description: 'Open recently played songs',
            url: '/Flux-Player/?shortcut=recent',
            icons: [{ src: 'ICON.png', sizes: '192x192' }]
          }
        ],

        share_target: {
          action: '/Flux-Player/share-target',
          method: 'GET',
          enctype: 'application/x-www-form-urlencoded',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        },

        file_handlers: [
          {
            action: '/Flux-Player/',
            accept: {
              'audio/mpeg': ['.mp3'],
              'audio/wav': ['.wav'],
              'audio/ogg': ['.ogg'],
              'audio/aac': ['.m4a']
            },
            icons: [{ src: 'ICON.png', sizes: '512x512', type: 'image/png' }],
            launch_type: 'single-client'
          }
        ],

        icons: [
          { src: 'ICON.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'ICON.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'ICON.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'ICON.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})