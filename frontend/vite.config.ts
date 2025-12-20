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
      'process.env.BACKEND_URL': JSON.stringify(env.BACKEND_URL || "__APP_BACKEND_URL__")
    },
    server: {
      proxy: {
        // Proxy API requests to avoid CORS errors during development
        '/api': {
          target: 'http://localhost:5000/api',
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
