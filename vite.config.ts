import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set VITE_BASE=/your-repo-name/ when deploying to GitHub Pages (not needed for username.github.io root)
  base: process.env.VITE_BASE || '/',
})
