# Marketplace Security & RBAC Review

A security audit was conducted on all endpoints under the Marketplace namespace.

## 1. Authentication & Authorization Structure

All private endpoints are bounded by Tenant Isolation and User Role validation.

| Endpoint | Context | Guard / Policy | Exposure |
|---|---|---|---|
| `GET /public/marketplace/home` | Public | None | Filtered items |
| `GET /public/marketplace/projects` | Public | None | Filtered items |
| `POST /public/marketplace/leads` | Public | FormRequest Validation | Submit only |
| `GET /tenant/marketplace/developer-profile` | Tenant Workspace | `DeveloperProfilePolicy@view` | Restricted to Tenant |
| `POST /tenant/marketplace/developer-profile` | Tenant Workspace | `DeveloperProfilePolicy@update` | Restricted to Tenant |
| `POST /tenant/marketplace/projects/{id}/publish` | Tenant Workspace | `ProjectPolicy@publish` | Restricted to Tenant |
| `POST /admin/marketplace/projects/{id}/moderate` | Central Admin | `MarketplaceModerationPolicy@moderate`| Admin Role Only |

## 2. API Schema Integrity (Data Leakage Protection)

To prevent commercial espionage and internal metric leakage:
* `PlotResource` implements dual serialization paths. Under `X-Public-Marketplace`, the API strips out:
  * `internal_cost`
  * `margin`
  * `developer_notes`
  * `internal_approval`
  * `commercial_calculations`
* These fields are accessible *only* within verified tenant CRM dashboards.
