import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    }),
    {
      name: 'copy-static',
      closeBundle() {
        // Copy static assets to dist
        const distStatic = resolve(__dirname, 'dist/static')
        const publicStatic = resolve(__dirname, 'public/static')
        if (!existsSync(distStatic)) mkdirSync(distStatic, { recursive: true })
        try {
          copyFileSync(resolve(publicStatic, 'styles.css'), resolve(distStatic, 'styles.css'))
          copyFileSync(resolve(publicStatic, 'app.js'), resolve(distStatic, 'app.js'))
        } catch(e) {
          // files may not exist yet
        }
      }
    }
  ]
})
