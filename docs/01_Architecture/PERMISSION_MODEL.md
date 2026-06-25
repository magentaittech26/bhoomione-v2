# Permission Model (RBAC)

BhoomiOne implements a robust Role-Based Access Control (RBAC) engine integrated into the Laravel routing middleware layer. This ensures users are restricted to features aligned with their organizational responsibilities.

---

## 🔑 Permissions Hierarchy

The platform defines fine-grained permissions categorized by module:

```
                          [System Access]
                                ||
               +----------------+----------------+
               ||                               ||
        [Tenant Level]                    [Global Admin]
               ||                               ||
  +------------+------------+             (Full System Access)
  |                         |
[layouts.view]        [layouts.manage]
```

### 1. Projects Registry Permissions
* `projects.view`: Authorized to browse list of Projects under tenant.
* `projects.manage`: Authorized to create, edit, or delete Projects.

### 2. Layouts CAD Permissions
* `layouts.view`: Browse layout specifications, query georeference status, and fetch SVG rendering streams.
* `layouts.manage`: Upload DXF files, run layer mapping configurations, execute auto-plot subdivision algorithms, and save Georeferencing anchor coordinates.

### 3. Plots Sales Permissions
* `plots.view`: Track parcel plot availability, price slabs, and measurements.
* `plots.manage`: Manually modify plot availability, override prices, and lock plots.

---

## 🏢 Platform System Roles

Users are assigned specific pre-configured Roles, which act as collections of permissions:

| System Role | Available Permissions | Typical User Persona |
| :--- | :--- | :--- |
| **Global Admin** | All platform permissions system-wide | Platform Operations Manager |
| **Tenant Admin** | All tenant-level permissions | Real Estate Company Owner |
| **Surveyor/Engineer**| `layouts.view`, `layouts.manage`, `projects.view` | Civil CAD Specialist |
| **Sales Executive** | `plots.view`, `plots.manage`, `projects.view` | Brokerage Agent |
| **Buyer** | `plots.view`, `layouts.view` (read-only) | Prospective Plot Purchaser |

---

## 🛡️ Route Middleware Enforcement

Laravel controllers apply authorization checks via `PermissionRequirementMiddleware`:

```php
Route::get('/layouts/{id}', [LayoutController::class, 'show'])
    ->middleware([PermissionRequirementMiddleware::class . ':layouts.view']);

Route::post('/layouts/{id}/geo-reference', [LayoutGeoController::class, 'geoReference'])
    ->middleware([PermissionRequirementMiddleware::class . ':layouts.manage']);
```

If a user lacks the specified permission claim in their session JWT, the middleware intercepts the call and terminates it with a `403 Forbidden` response.
