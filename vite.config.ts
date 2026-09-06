import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base is './' so the built site works on GitHub Pages under any sub-path
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as any)
