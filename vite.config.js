import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const alias = [
  'components',
  'hooks',
  'utils',
  'types',
  'lib',
  'config',
  'stores',
  'services',
  'constants',
  'assets',
  'styles',
  'strategies',
  'factories',
  'observers'
].reduce((acc, dir) => {
  acc[`@/${dir}`] = path.resolve(__dirname, `./src/${dir}`);
  return acc;
}, { '@': path.resolve(__dirname, './src') });

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [react()],
  resolve: {
    alias,
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-router': ['react-router-dom'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      '@reduxjs/toolkit',
      'react-redux',
      'react-router-dom',
    ],
  },
}));
