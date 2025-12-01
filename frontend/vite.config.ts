import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Using '.' instead of process.cwd() to avoid TypeScript errors if Node types are missing
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    // Polyfill process.env for the GenAI SDK and Resend
    // If keys are not present at build time, use placeholders that will be replaced 
    // by the Docker entrypoint script at runtime.
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "__APP_API_KEY__"),
      'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY || "__APP_RESEND_API_KEY__"),
      'process.env.NOTIFICATION_EMAIL': JSON.stringify(env.NOTIFICATION_EMAIL || "__APP_NOTIFICATION_EMAIL__"),
      'process.env.BACKEND_URL': JSON.stringify(env.BACKEND_URL || "__APP_BACKEND_URL__")
    },
    server: {
      proxy: {
        // Proxy API requests to avoid CORS errors during development
        '/api': {
          target: 'https://savings-api.mabdelhay.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    }
  };
});
