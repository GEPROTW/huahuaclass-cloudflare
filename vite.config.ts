
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      proxy: {
        // Proxy API requests to Cloudflare Worker (local wrangler dev usually runs on 8787)
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
        // Proxy Image requests to Cloudflare Worker
        '/images': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        }
      }
    }
  };
});
