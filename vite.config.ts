import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plain SPA build: `vite build` emits a static dist/ that any static host
// (Vercel / Cloudflare Pages / GitHub Pages) can serve. The app talks to the
// backend purely over VITE_API_BASE_URL at runtime, so there's no server-side
// piece to deploy and no proxy config needed here.
//
// base: the app is served from the project-pages subpath
// https://fsp-fishsocialplatform.github.io/fsp-admin/, so assets must resolve
// under /fsp-admin/ rather than the domain root — otherwise every JS/CSS URL
// 404s and the page is blank. Overridable via BASE_PATH so a root-domain host
// (Vercel/Cloudflare) can build with '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/fsp-admin/',
});

