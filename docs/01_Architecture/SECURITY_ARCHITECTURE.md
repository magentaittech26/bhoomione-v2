# Security Architecture

BhoomiOne maintains enterprise-grade security protocols across all operational bounds to safeguard proprietary cadastral assets and user billing histories.

---

## 🛡️ Security Parameters & Enforcement

### 1. JSON Web Token (JWT) Authentication
* All user sessions are fully stateless.
* Upon successful authentication via `POST /api/v1/auth/login`, the Laravel backend signs an RS256 JWT containing:
  * `userId`: Subscriber UUID
  * `tenantId`: Tenant context UUID
  * `role`: User role configuration
  * `permissions`: Array of assigned RBAC permissions
* The token is returned to the React SPA client and passed inside the `Authorization: Bearer <token>` header for subsequent requests.

### 2. Dynamic Cross-Origin Resource Sharing (CORS)
* The Laravel API validates origin parameters dynamically.
* Requests originating from unconfigured subdomains or unknown tenant endpoints are rejected immediately.
* Cookies are set with `SameSite=None` and `Secure` to facilitate safe iframe previews in development sandboxes.

### 3. Nginx Gateway Hardening
* The reverse proxy strips unnecessary headers (`X-Powered-By`, `Server: nginx`).
* Implements robust body size constraints to prevent Buffer Overflow exploits during multi-megabyte CAD DXF uploads:
  ```nginx
  client_max_body_size 50M;
  ```
* Strict Cross-Origin Opener Policies (COOP) and Cross-Origin Embedder Policies (COEP) protect browser contexts from leakage.

### 4. Data Encryption at Rest and in Transit
* All external data exchanges run exclusively over TLS 1.3.
* High-precision similarity coordinates matrices, private billing credentials, and tenant overrides are salted and hashed or protected via native PostgreSQL encryption vectors.
