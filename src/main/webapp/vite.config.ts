import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    base: '/daily',
    plugins: [
        react(),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'custom-sw.js',
            manifest: false, // Do not generate a manifest
        }),
    ],
    resolve: {
        alias: {
            '@api': path.resolve(__dirname, './src/api.ts'),
            '@api/*': path.resolve(__dirname, './client-api'),
        },
    },
    build: {
        commonjsOptions: {
            transformMixedEsModules: true, // Enable mixed module transformation
            include: [/client-api/, /node_modules/],
        },
    },
    server: {
        proxy: {
            '/daily/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
    test: {
        fileParallelism: false,
        globals: true,
        testTimeout: 10000,
        environment: 'jsdom',
        setupFiles: ['src/test/setupBrowserTests.tsx'],
        browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            screenshotFailures: false,
            instances: [
                {
                    browser: 'chromium',
                },
            ],
        },
        include: ['src/**/*.spec.{ts,tsx}'],
        reporters: ['default', ['junit', { outputFile: 'test-report.xml' }], 'verbose'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'cobertura', 'lcov'],
            exclude: [
                '**/*.js',
                '**/*.mjs',
                '**/*.mts',
                'src/test/**',
                '**/vite.config.ts',
                '**/main.tsx',
            ],
        },
    },
});
