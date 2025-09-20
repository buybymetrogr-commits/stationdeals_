import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        warn(warning);
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          leaflet: ['leaflet']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: '/'
});