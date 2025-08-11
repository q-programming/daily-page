import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
    base: '/daily',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'icon-192x192.png', 'icon-512x512.png'],
            manifest: false, // We're using our own manifest file
        }),
    ],
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
