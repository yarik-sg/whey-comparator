import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const resolveDevApiTarget = () => {
  const candidate = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env?.VITE_DEV_API_PROXY;

  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return 'http://localhost:8000';
};

const DEV_API_TARGET = resolveDevApiTarget();

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: DEV_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
