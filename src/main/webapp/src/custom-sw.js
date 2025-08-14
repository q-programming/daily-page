import { precacheAndRoute } from 'workbox-precaching';

// This is a placeholder for the manifest that will be injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('fetch', (event) => {
    // Don't cache anything. Just fetch from the network.
    event.respondWith(fetch(event.request));
});
