import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'inject-sw-env',
        // Runs after build is complete
        closeBundle() {
          const swPath = resolve(__dirname, 'dist/firebase-messaging-sw.js')
          try {
            let sw = readFileSync(swPath, 'utf-8')
            sw = sw
              .replace('__VITE_API_KEY__',            env.VITE_FIREBASE_API_KEY            || '')
              .replace('__VITE_AUTH_DOMAIN__',         env.VITE_FIREBASE_AUTH_DOMAIN        || '')
              .replace('__VITE_PROJECT_ID__',          env.VITE_FIREBASE_PROJECT_ID         || '')
              .replace('__VITE_STORAGE_BUCKET__',      env.VITE_FIREBASE_STORAGE_BUCKET     || '')
              .replace('__VITE_MESSAGING_SENDER_ID__', env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '')
              .replace('__VITE_APP_ID__',              env.VITE_FIREBASE_APP_ID             || '')
            writeFileSync(swPath, sw)
            console.log('✅ SW env vars injected successfully')
          } catch (e) {
            console.warn('⚠️  SW inject skipped (dev mode or file not found)')
          }
        }
      }
    ],
    resolve: {
      alias: { '@': '/src' }
    }
  }
})