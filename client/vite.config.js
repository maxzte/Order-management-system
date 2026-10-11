import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'public',
  publicDir: 'static',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true
      },
      '/static': {
        target: 'http://localhost:9000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        admin: resolve(__dirname, 'public/admin.html'),
        basket: resolve(__dirname, 'public/basket.html'),
        orders: resolve(__dirname, 'public/orders.html'),
        dish: resolve(__dirname, 'public/dish.html'),
        menuCategories: resolve(__dirname, 'public/menuCategories.html'),
        categoryDishes: resolve(__dirname, 'public/categoryDishes.html'),
        register: resolve(__dirname, 'public/register_form.html')
      }
    }
  }
});
