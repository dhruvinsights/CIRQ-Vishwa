import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dev: Vite on :5173 proxies API + SDK routes to the Python backend on :8100.
// Prod: `vite build` -> dist/, served by the Python backend (one origin, as the SDK requires).
const backend = process.env.BACKEND_URL || 'http://127.0.0.1:8100';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': import.meta.dirname } },
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/auth': backend,
      '/_sdk': backend,
      '/healthz': backend,
      '/readyz': backend,
    },
  },
});
