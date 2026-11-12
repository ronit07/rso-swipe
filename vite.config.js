import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is the repo name so the build works on GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/rso-swipe/',
})
