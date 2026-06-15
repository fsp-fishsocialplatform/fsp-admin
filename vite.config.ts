import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plain SPA build: `vite build` emits a static dist/ that any static host
// (Vercel / Cloudflare Pages / GitHub Pages) can serve. The app talks to the
// backend purely over VITE_API_BASE_URL at runtime, so there's no server-side
// piece to deploy and no proxy config needed here.
export default defineConfig({
  plugins: [react()],
});
