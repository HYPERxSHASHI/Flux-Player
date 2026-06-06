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
        // Allows the share-target feature to work properly offline
        navigateFallback: '/Flux-Player/index.html',
        navigateFallbackAllowlist: [/^\/Flux-Player\/share-target/]
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
        display_override: ['window-controls-overlay', 'standalone'], // Window controls capabilities
        orientation: 'portrait',
        categories: ['music', 'utilities'],

        // --- 1. APP SHORTCUTS (Long press app icon on home screen) ---
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

        // --- 2. SHARE TARGET (Receive audio files shared from other apps) ---
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

        // --- 3. FILE HANDLERS (Open audio files directly with Flux Player) ---
        file_handlers: [
          {
            action: '/Flux-Player/',
            accept: {
              'audio/mpeg': ['.mp3'],
              'audio/wav': ['.wav'],
              'audio/ogg': ['.ogg'],
              'audio/aac': ['.m4a']
            },
            icons: [
              {
                src: 'ICON.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ],
            launch_type: 'single-client'
          }
        ],

        // --- Standard Round/Square Icon Allocations ---
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
            purpose: 'maskable'
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