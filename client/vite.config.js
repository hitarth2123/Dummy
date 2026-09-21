import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const logApiProxy = (proxy) => {
  proxy.on('proxyReq', (proxyReq, req) => {
    console.log(`[Vite Proxy] request ${req.method} ${req.url} -> backend:5012`);
  });
  proxy.on('proxyRes', (proxyRes, req) => {
    console.log(`[Vite Proxy] response ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  });
  proxy.on('error', (error, req) => {
    console.error(`[Vite Proxy] failed ${req.method} ${req.url}: ${error.message}`);
  });
};

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@routes': path.resolve(__dirname, './src/routes'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: ['aibuddy-2.onrender.com'],
    proxy: {
      '/api': { target: 'http://localhost:5012', changeOrigin: true, configure: logApiProxy },
    },
  },
});
