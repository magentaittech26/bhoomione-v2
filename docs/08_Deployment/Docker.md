# Multi-Stage Production Docker Configuration

BhoomiOne operates on standard multi-stage production Docker configurations to maximize build caching, eliminate compile bloat, and guarantee minimal container footprint sizes.

---

## 📦 Docker Container Architecture

The staging and production workloads are bundled together within multi-stage structures:

```
  Stage 1: PHP Composer Builder =====> Standard PHP production packages
  Stage 2: Node Frontend Compiler ===> Static built React distribution files
  Stage 3: Production Base Engine ====> Fused PHP-FPM, Nginx configuration, and React assets
```

---

## 🛠️ Docker Container Build Command Parameters

* **Composer Opts**: Production Composer files are compiled using optimizing flags to reduce memory and cold-start latencies:
  ```bash
  composer install --no-dev --optimize-autoloader --no-interaction
  ```
* **Frontend Opts**: Production Vite compiles static code into the `dist` directory:
  ```bash
  npm run build
  ```
* **Production Base Configuration**: The final stage copies the compiled React assets directly into Nginx's document root, and routes API requests directly to the local PHP-FPM socket via FastCGI wrappers.
