# React Front-End serving & Vite Configurations

This document outlines the static asset routing, browser history fallbacks, and asset compression mechanisms of the BhoomiOne React front-end client.

---

## ⚛️ Vite Production Compiler Configurations

The React front-end compiles using Vite. Production settings inside `vite.config.ts` maximize static delivery efficiency:
* **JS Code Chunking**: Heavy map libraries are chunked out of the primary `index.js` file to accelerate first-paint speeds:
  ```typescript
  // Example Code Splitting
  rollupOptions: {
    output: {
      manualChunks: {
        maps: ['@googlemaps/js-api-loader', 'leaflet'],
        react: ['react', 'react-dom', 'react-router-dom']
      }
    }
  }
  ```
* **Asset Compression**: Built assets are pre-compressed using gzip/brotli to minimize network transport times.

---

## 🛣️ Browser History routing Fallbacks (SPA Routing)

Since React utilizes client-side routing (`react-router-dom`), any browser page-refresh triggers a request to Nginx. To prevent standard Nginx `404 Not Found` errors, the server configuration routes all fallback paths back to the main static document:

```nginx
# Nginx SPA Fallback directive
location / {
    try_files $uri $uri/ /index.html;
}
```
This forces the browser to load `index.html` first, allowing React Router to successfully resolve the nested route parameters client-side.
