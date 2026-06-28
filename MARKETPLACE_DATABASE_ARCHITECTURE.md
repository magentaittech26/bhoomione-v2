# Marketplace Database Architecture

This document details the schema designs, relations, indexes, and column transformations introduced to build the Marketplace Foundation on PostgreSQL.

## 1. Schema Diagrams & Tables

### A. `developer_profiles` (Altered / Hardened)
Tracks developer verification credentials, years in business, and public visibility controls.
* `gst` (VARCHAR 50, nullable): Registered Goods & Services Tax identifier.
* `public_visibility` (BOOLEAN, default true): Toggles whether the profile and its projects are discoverable in the public listing.

### B. `projects` (Altered / Hardened)
Holds metadata regarding physical layouts and scheduling controls.
* `publishing_status` (VARCHAR 50, default 'Draft'): Current listing state (`Draft`, `Pending Approval`, `Published`, `Featured`, `Archived`, `Hidden`).
* `is_featured` (BOOLEAN, default false): Quick identifier for home-feed spotlight display.
* `seo_settings` (JSONB): Dynamic storage of meta titles, canonical links, and OpenGraph variables.
* `moderation_status` (VARCHAR 50, default 'PENDING'): Central review status (`PENDING`, `APPROVED`, `REJECTED`).
* `moderation_history` (JSONB): Timeline logs of administrative actions.
* `views_count` (INTEGER, default 0): Accumulated total views.
* `publish_date` (TIMESTAMP, nullable): Date for auto-publishing.
* `unpublish_date` (TIMESTAMP, nullable): Date for auto-unpublishing.

### C. `marketplace_moderation_history` (New Table)
Maintains an immutable record of administrative interventions.
* `id` (UUID, Primary Key)
* `project_id` (UUID, foreign key referencing `projects.id` with cascade on delete)
* `status` (VARCHAR 50): Target state (e.g., `Published`, `Archived`, `Suspended`).
* `reason` (TEXT): Audit justification details.
* `moderated_by` (VARCHAR 255): User or system entity committing the moderation action.
* `timestamps` (`created_at`, `updated_at`)

### D. `marketplace_analytics_cache` (New Table)
Optimized storage to avoid expensive counts on large analytical collections.
* `id` (UUID, Primary Key)
* `tenant_id` (UUID, Unique, referencing `tenants.id` with cascade on delete)
* `views_count` (INTEGER, default 0)
* `leads_count` (INTEGER, default 0)
* `conversion_rate` (DECIMAL 5, 2, default 0.00)

### E. `marketplace_view_tracking` (New Table)
Tracks granular public engagement logs.
* `id` (UUID, Primary Key)
* `project_id` (UUID, referencing `projects.id` with cascade on delete)
* `ip_address` (VARCHAR 50)
* `user_agent` (VARCHAR 255)
* `created_at` (TIMESTAMP)

## 2. Indexes & Performance Optimization
To maintain snappy page loads under high volume, the following indexes are declared:
* `idx_projects_publishing_status` on `projects(publishing_status)`
* `idx_developer_profiles_public_visibility` on `developer_profiles(public_visibility, verification_status)`
* `idx_marketplace_view_tracking_project` on `marketplace_view_tracking(project_id)`
