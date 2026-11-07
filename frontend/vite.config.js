import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

// GitHub Pages ne connaît pas les routes React (/admin, /login…) :
// on copie index.html en 404.html pour qu'un rafraîchissement recharge l'application.
const spaFallback404 = () => {
  let outDir = 'dist';
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // '/' en local ; '/miabetrans/' sur https://primero0777.github.io/miabetrans/
    base: env.VITE_BASE || '/',
    plugins: [react(), spaFallback404()],
    server: {
      port: 5173,
      open: true,
    },
  };
});
