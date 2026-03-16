import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Rupee Tracker',
        short_name: 'Rupee Tracker',
        description: 'Your money. Your control.',
        theme_color: '#0f0f13',
        background_color: '#0f0f13',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://api.dicebear.com/7.x/initials/svg?seed=RT&backgroundColor=a78bfa',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'https://api.dicebear.com/7.x/initials/svg?seed=RT&backgroundColor=a78bfa',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})