import { defineConfig } from 'vite';

export default defineConfig({
    root: './frontend',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    server: {
        port: 3000,
        proxy: {
            '/api': 'http://localhost:3000'
        }
    }
});