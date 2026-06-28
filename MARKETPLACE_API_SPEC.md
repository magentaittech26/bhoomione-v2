# Marketplace API Specification (v1)

All endpoints below reside under `/api/v1` and communicate strictly in JSON format.

---

## 1. Public Discovery Endpoints (Unauthenticated)

### A. Get Marketplace Feed
* **Route:** `GET /public/marketplace/home`
* **Response (200):**
```json
{
  "featured_projects": [...],
  "latest_projects": [...],
  "featured_developers": [...],
  "popular_locations": [...],
  "recently_added": [...],
  "investment_opportunities": [...],
  "new_launches": [...],
  "trending_projects": [...]
}
```

### B. Search Projects
* **Route:** `GET /public/marketplace/projects`
* **Query Parameters:**
  * `search` (string)
  * `state`, `district`, `city` (string)
  * `min_price`, `max_price` (numeric)
  * `min_area`, `max_area` (numeric)
  * `facing` (string)
  * `sort_by` (`newest`, `price`, `area`, `popularity`, `featured`)
* **Response (200):** Paginated collection of `ProjectResource` models.

### C. Get Project Details
* **Route:** `GET /public/marketplace/projects/{id}`
* **Response (200):** Detailed project model populated with `layouts` and public `plots`, complete with auto-generated SEO metadata.

### D. Submit Lead Capture Form
* **Route:** `POST /public/marketplace/leads`
* **Payload:**
```json
{
  "tenant_id": "993a46cc-c87e-409e-8c3b-741be0fa3241",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+919999888877",
  "lead_type": "Book Site Visit",
  "message": "Looking to visit this weekend."
}
```
* **Response (201):**
```json
{
  "success": true,
  "message": "Your request has been registered successfully. Our executive will reach out to you shortly.",
  "lead": { ... }
}
```

---

## 2. Tenant Back-Office Operations (Authenticated, Tenant Context Verified)

### A. Update Developer Profile
* **Route:** `POST /tenant/marketplace/developer-profile`
* **Response (200):** Updated `DeveloperProfileResource`.

### B. Publish or Schedule Project
* **Route:** `POST /tenant/marketplace/projects/{id}/publish`
* **Payload:**
```json
{
  "status": "Published",
  "publish_date": "2026-07-01 00:00:00",
  "unpublish_date": null
}
```

### C. Get Leads Analytics & Monthly Trends
* **Route:** `GET /tenant/marketplace/dashboard-stats`
* **Response (200):** High-density aggregate view of leads, views, and MoM conversion rates.
