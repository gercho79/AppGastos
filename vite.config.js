import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'AppGastos',
        short_name: 'AppGastos',
        description: 'Gestión de gastos e ingresos personales',
        start_url: './',
        display: 'standalone',
        background_color: '#0a0a14',
        theme_color: '#6c63ff',
        orientation: 'portrait-primary',
        lang: 'es',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['finance', 'utilities'],
        shortcuts: [
          {
            name: 'Nuevo Gasto',
            short_name: 'Gasto',
            url: './#gastos',
            description: 'Registrar un nuevo gasto'
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            url: './#dashboard',
            description: 'Ver resumen de cuentas'
          }
        ]
      },
      workbox: {
        // Cache Google Fonts
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Google Sheets API - Network first (always get fresh data)
            urlPattern: /^https:\/\/sheets\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Google Auth - Network only
            urlPattern: /^https:\/\/accounts\.google\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ],
        // Don't precache external resources
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/]
      },
      devOptions: {
        enabled: true // Enable PWA in dev mode for testing
      }
    })
  ]
});
