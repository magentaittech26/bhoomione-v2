# BhoomiOne V3 — Standard Role Templates

## 1. Role Matrix Overview

| Role Code | Role Name | Scope | Target User Persona |
|---|---|---|---|
| `PLATFORM_ADMIN` | Platform Admin | `GLOBAL` | Platform Super Administrators (Full Access) |
| `PLATFORM_SUPPORT` | Platform Support | `GLOBAL` | Platform Customer Support Personnel (Read-Only) |
| `DEVELOPER_OWNER` | Developer Owner | `TENANT` | Workspace Founder / Primary Account Owner |
| `DEVELOPER_ADMIN` | Developer Admin | `TENANT` | Tenant Executive Administrator |
| `PROJECT_MANAGER` | Project Manager | `TENANT` | Real Estate Project Engineering Lead |
| `SALES_MANAGER` | Sales Manager | `TENANT` | Real Estate Sales & CRM Operations Lead |
| `SURVEYOR` | Surveyor / Map Operator | `TENANT` | Spatial / GIS Cadastral Data Specialist |
| `READ_ONLY_USER` | Read-Only User | `TENANT` | Stakeholder / Auditor (View Only) |
| `CUSTOMER` | Customer Profile | `TENANT` | Buyer / Property Investor |

## 2. Permission Assignments by Template

### Platform Super Admin (`PLATFORM_ADMIN`)
- **Scope**: `GLOBAL`
- **Permissions**: Wildcard (`*`) — Bypass / Full platform access across all modules and tenants.

### Developer Owner (`DEVELOPER_OWNER`)
- **Scope**: `TENANT`
- **Permissions**: Full tenant administrative control over Masters, Projects, Layouts, Interactive Maps, Plots, DXF Uploads, Sales, RBAC, and Subscriptions.

### Developer Admin (`DEVELOPER_ADMIN`)
- **Scope**: `TENANT`
- **Permissions**: Full tenant operational management (excluding tenant deletion and subscription tier purchases).

### Project Manager (`PROJECT_MANAGER`)
- **Scope**: `TENANT`
- **Permissions**: View/Create/Edit Projects, Layouts, Plots, GIS Uploads, and Measurement Units viewing.

### Surveyor (`SURVEYOR`)
- **Scope**: `TENANT`
- **Permissions**: View/Edit GIS layers, Draw geometries, Upload DXF files, Split/Merge plots, Validate topology.

### Read-Only User (`READ_ONLY_USER`)
- **Scope**: `TENANT`
- **Permissions**: `projects.view`, `layouts.view`, `maps.view`, `plots.view`, `masters.measurement_units.view`.
