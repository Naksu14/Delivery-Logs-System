import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
   server: {
    host: '0.0.0.0',
    port: 5185,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3014' ,
        changeOrigin: true,
      },
    },
  },
})
