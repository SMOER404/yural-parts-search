import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// API Favorit работает по http и не объявляет CORS,
// поэтому в dev-режиме ходим к нему через прокси Vite.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://api.favorit-parts.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/hs/hsprice'),
      },
    },
  },
});
