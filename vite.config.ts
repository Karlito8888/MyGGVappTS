import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  plugins: [
    tanstackRouter({ autoCodeSplitting: true }),
    viteReact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'AppImages/**/*.png',
        'AppImages/icons.json',
        'robots.txt'
      ],
      manifest: {
        name: 'MyGGV',
        short_name: 'MyGGV',
        description: 'GGV Progressive Web App',
        theme_color: '#0c0c0c',
        background_color: '#0c0c0c',
        categories: ['social', 'lifestyle'],
        lang: 'fr',
        icons: [
          // Android icons
          {
            src: 'AppImages/android/android-launchericon-48-48.png',
            sizes: '48x48',
            type: 'image/png',
          },
          {
            src: 'AppImages/android/android-launchericon-72-72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'AppImages/android/android-launchericon-96-96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'AppImages/android/android-launchericon-144-144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'AppImages/android/android-launchericon-192-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'AppImages/android/android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          // Maskable icons for Android
          {
            src: 'AppImages/android/android-launchericon-192-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'AppImages/android/android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          // iOS icons
          {
            src: 'AppImages/ios/120.png',
            sizes: '120x120',
            type: 'image/png',
          },
          {
            src: 'AppImages/ios/152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'AppImages/ios/180.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: 'AppImages/ios/192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'AppImages/ios/512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'AppImages/ios/1024.png',
            sizes: '1024x1024',
            type: 'image/png',
          },
        ],
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        display_override: ['window-controls-overlay', 'standalone'],
        edge_side_panel: {
          preferred_width: 320
        },
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-fallback',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': './src',
    },
  },
})
