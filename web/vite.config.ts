import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    // Ensure HMR works in iframes and mobile viewers
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
  },
  // Ensure base URL is set correctly
  base: '/',
  // Optimize for mobile
  build: {
    target: 'es2015',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  // Ensure proper MIME types
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
