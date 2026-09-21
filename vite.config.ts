import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'

function expressServerPlugin(): Plugin {
  let serverProcess: ChildProcess | null = null

  const startServer = () => {
    if (serverProcess && !serverProcess.killed) return
    const tsxCli = path.resolve(import.meta.dirname, 'node_modules/tsx/dist/cli.mjs')
    const serverScript = path.resolve(import.meta.dirname, 'Server/index.ts')

    serverProcess = spawn(process.execPath, [tsxCli, serverScript], {
      stdio: 'inherit',
      env: { ...process.env },
    })

    serverProcess.on('error', (err) => {
      console.error('❌ Error al iniciar el servidor Express:', err)
    })

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.warn(`⚠️ Servidor Express finalizó con código: ${code}`)
      }
      serverProcess = null
    })
  }

  const killServer = () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill()
      serverProcess = null
    }
  }

  const restartServer = () => {
    killServer()
    setTimeout(() => {
      startServer()
    }, 400)
  }

  return {
    name: 'express-server-runner',
    apply: 'serve',
    configureServer(server) {
      startServer()

      server.watcher.on('change', (file) => {
        if (file.includes('Server') || file.includes('server')) {
          restartServer()
        }
      })

      server.httpServer?.on('close', killServer)
      process.once('SIGINT', () => {
        killServer()
        process.exit()
      })
      process.once('SIGTERM', () => {
        killServer()
        process.exit()
      })
      process.once('exit', killServer)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    expressServerPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})

