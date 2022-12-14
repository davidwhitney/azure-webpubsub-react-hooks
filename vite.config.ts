import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';

export default defineConfig({  
  root: "sample-app",
  server: {
    port: 8080,
    strictPort: true,
    host: true,
    proxy: {
      '/api': 'http://localhost:7071'
    }
  },
  plugins: [react()]
})