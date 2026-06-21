# BHOOMIONE V2: TENANCY & DATA PLATFORM DECISION RECORD
**Document ID**: BHOOMIONE-V2-TENANCY-DECISION  
**Status**: Decided & Locked  
**Version**: 2.5  
**Domain Scope**: Multi-Tenant Routing, GIS Coordinates, SQL Schema Isolation, Enterprise Scaling  

---

## 1. Context & Operational Constraints

BhoomiOne is not a standard business transactional CRM. It is a **Digital Land Operating System** whose computational workloads are uniquely heavy and structurally complex. Choosing a tenancy model requires reconciling raw CPU processing constraints, complex geospatial operations, and enterprise security realities:

1.  **High-Density Geodata (PostGIS Polygons)**: Every layout contains hundreds of complex spatial vectors, boundary loops, dimension arcs, and centroid placements. Running GIS intersects, overlaps, and neighborhood buffering queries requires immense indexing memory (`GIST` indexes).
2.  **Volatile CPU Peak Spikes (DXF/AutoCAD Processing)**: DXF file parsing takes static engineering text layers, parses them through continuous-polygon extraction algorithms, and populates PostgreSQL tables at scale. 
3.  **Strict Compliance Records (Customer Ownership & Documents)**: Indian real estate land commerce (RERA, Revenue Deeds, KYC, Ledgers) demands high data integrity, strict audit logging, and immutable data segregation to prevent catastrophic customer cross-tenant leakage.
4.  **Commercial Realities**: B2B growth depends on a clear **multi-tiered monetizing upsell path**, taking small plot developers from cheap, instantly provisioned shared infrastructure (Starter Plan) up to custom-configured, highly compliant private servers (Enterprise/Private Cloud) without code rewrites or system regressions.

---

## 2. In-Depth Comparative Tenancy Analysis

To evaluate the 5-year scaling vision target of **5,000+ developers, 50,000 layouts, and 1,000,000+ active plots**, we analyze three primary multi-tenant architectural methods:

### Option A: Shared Database + Row-Level Security (RLS)
Every developer tenant resides within the same physical PostgreSQL database instance, isolated by high-level database constraints (`WHERE tenant_id = ?`) or PostgreSQL Native Row-Level Security.

*   **GIS Polygons & DXF Processing**: 
    *   *Saves compute cost*: Centralized database handles spatial searches easily.
    *   *Computational bottleneck*: Heavy, concurrent CAD imports by multiple developers will consume connection pools, causing layout rendering delays for all other tenants.
*   **Customer & Document Isolation**: Highly fragile. A single developer mistake (e.g. raw SQL query bypassing Eloquent/Hibernate scopes) can breach financial balances, ledgers, or private document stores.
*   **White-Label & Dedicated VPS Upsell**: Practically impossible. Extracting high-tier builders to their private VPS requires a complex, destructive ETL database surgery.
*   **Verdict**: Excellent for bootstrapping V1; inadequate for V2's long-term business profile.

---

### Option B: Deep Database-Per-Tenant Isolation
Every developer is provisioned with their own physically segregated PostgreSQL database instance (or completely isolated schema workspace).

*   **GIS Polygons & DXF Processing**: Extremely secure. Layout processing, CPU-intensive polygon detection, and GIS routing on Developer A's system will never degrade performance on Developer B's maps.
*   **Customer & Document Isolation**: Absolute. Database connections are hardcoded to isolated credentials. Even a catastrophic logical bug in the application routing layer cannot leak data across database boundaries.
*   **White-Label & Dedicated VPS Upsell**: Extremely natural. To scale a tenant to a dedicated VPS, simply back up their PostgreSQL container, shift the volume to a new environment, and update Nginx host headers.
*   **Platform Marketplace Nightmare**: Building a unified consumer landing directory (`bhoomione.in` searching all layout plots by facing/price/location) requires setting up volatile real-time database crawling, expensive cross-node database linking, or highly complex data aggregation indexes (Elasticsearch/CQRS sync).
*   **Verdict**: Solid for high-tier enterprise players, but causes instant resource overflow under small-developer scale due to connection pool overhead.

---

### Option C (Approved Core Standard): Hybrid Adaptive Provisioning Model
A dynamic, metadata-driven execution framework that defaults low-tier tenants to a logical shared-cache database workspace and dynamically escalates growing developers into physically dedicated SQL instances or remote VPS containers based on subscription claims.

```
                                  ┌───────────────────────────────┐
                                  │   API Gateway Domain Router   │
                                  └───────────────┬───────────────┘
                                                  │ Resolve Host Header
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │   Stateful Connection Proxy   │
                                  │   (Tenant connection router)  │
                                  └───────┬───────────────┬───────┘
                                          │               │
                 Route Basic / Growth Tiers │               │ Route Enterprise / Custom SLA
                                          ▼               ▼
                       ┌────────────────────┐   ┌───────────────────────────────┐
                       │  SaaS Shared Pool  │   │   Dedicated Database/VPS     │
                       │   - RLS Scoping    │   │   - Isolated GIS Processes    │
                       │   - Shared Indices │   │   - Zero Connection Collusion │
                       └────────────────────┘   └───────────────────────────────┘
```

The dynamic database driver checks an in-memory cache register (managed inside Redis) to resolve the tenant's targeting credential on every API call.

*   **Starter Plan**: Low-overhead logical tenant on a master shared PostgreSQL cluster, using parameterized columns and strict tenant-scoping middleware.
*   **Growth Plan**: The connection proxy migrates them to a dedicated metadata schema namespace *within* the master PostgreSQL cluster, completely isolating tables while keeping physical resources shared.
*   **Enterprise Plan**: Provisioned with a distinct, physically isolated PostgreSQL container on the core cluster, maintaining private database connection pools.
*   **Private Cloud/VPS & White-label**: Connection string routes dynamically over a private tunnel (WireGuard/VPN) directly to their private machine instance.

---

## 3. Comparative Architecture Decision Matrix

| Architectural Dimension | Option A: Shared DB + RLS | Option B: DB-Per-Tenant | Option C: Hybrid Adaptive Model (Recommended) |
| :--- | :--- | :--- | :--- |
| **System Bootstrapping Overhead** | **Near Zero**: Minimal setup, low infrastructure costs. | **High**: Complicated initial DevOps pipeline setup. | **Moderate**: Requires build-time custom connection resolvers. |
| **GIS Coordinate & Shape Queries**| **Complex at scale**: Large index sizes on GIST. | **Optimistic**: Lightweight localized queries. | **Hybrid**: Shared public registry with private local transaction tables. |
| **DXF Heavy CAD File Imports** | **Terrible**: Heavy CPU locks degrade performance globally. | **Perfect**: Resource isolating boundary limits CPU. | **Excellent**: Async worker queues dynamically scale processes. |
| **Enterprise White-Label Scaling** | **Virtually Impossible**: High risk of data pollution. | **Native**: Already physically compiled apart. | **Native Upsell**: Migration requires updating connection routes. |
| **System-wide Marketplace Sync** | **Instant**: Standard SQL queries index easily. | **Complex**: Requires asynchronous CDC or ETL streams. | **Dual-Engine**: Read caches marketplace while transactional databases partition. |
| **Operational Maintenance Cost** | **Low**: Single master migration target. | **Extremely High**: Migrating a schema requires 5,000 runs. | **Optimized**: High-tier schemas migrate independently. |

---

## 4. The 5-Year Tenancy Roadmap

To achieve absolute system scalability, the **Hybrid Adaptive Tenancy Model** is configured to evolve across four specific commercial bounds:

```
[ Tier 1: Starter ]          [ Tier 2: Growth ]          [ Tier 3: Enterprise ]        [ Tier 4: Private Cloud ]
  Shared DB Cluster   ───>     Isolated Schemas   ───>     Dedicated Database   ───>     Private VPS Nodes
 (Logical tenant_id)         (Metadata schema)           (Protected Container)          (Fully White-labeled)
```

### Tier 1: Starter Plan (Logical Multi-Tenancy)
*   **Infrastructure**: Single PostgreSQL 17 cluster, single Node application server.
*   **Isolation**: Every business database table includes a `tenant_id UUID NOT NULL` column. All database access layers enforce logical constraints on query parameters.
*   **Geospatial Layer**: Pre-compiled SVG files are stored in S3, minimizing database workload.
*   **KYC / Auditing**: Basic table tracking with indexes on `(tenant_id, created_at)`.

### Tier 2: Growth Plan (Logical Schema Separation)
*   **Infrastructure**: Shared PostgreSQL cluster, schema name prefix isolation matches tenant workspace context.
*   **Isolation**: At connection handshake, connection manager executes: `SET search_path TO tenant_tenant_uuid, public;`.
*   **Migrating from Starter**: Zero system rewrites are required. Database services run a lightweight migration script that copies records matching `tenant_id` into a newly initialized database schema schema. The connection metadata in Redis updates seamlessly.

### Tier 3: Enterprise Plan (Physical Tenant Database)
*   **Infrastructure**: Physically separate PostgreSQL container instances on private cloud blocks.
*   **Isolation**: Physical database connection isolation. High pool optimization buffers geodata.
*   **Migrating from Growth**: Automated DevOps systems run a single schema dump command (`pg_dump -n tenant_tenant_uuid`) and restore it on the newly allocated physical database cluster. The runtime configuration updates the routing connection string, leaving raw API endpoints 100% untouched.

### Tier 4: Private Cloud / Dedicated VPS (System White-Labeling)
*   **Infrastructure**: Fully dedicated, single-tenant server stacks configured via automated Terraform modules.
*   **Customization**: Fully isolated Nginx, Redis, and API containers running custom domain mappings.
*   **Network Layer**: All public analytics or global directory lookups stream to the master platform core asynchronously via highly secured JSON API webhooks, eliminating direct server connection pipelines.

---

## 5. Architectural Proof-of-Concept & Implementation Plan

To enable transition paths across all tiers without application-level modifications, developers must ensure the following implementation standards:

1.  **Strict Abstract Repository Patterns**: No controller or business service is allowed to instantiate direct connections or write hardcoded queries. Global query factories must rely entirely on abstract connection interfaces:
    ```typescript
    // Standard execution uses dynamic connection routing, isolating physical destination from code logic
    const activeDatabase = DatabaseManager.resolveConnection(tenantContext);
    const plotInfo = await activeDatabase.table('plots').where('id', plotId).first();
    ```
2.  **Stateless Request Handlers**: Static assets, SVG routes, and pre-compiled vectors are saved exclusively with absolute URLs mapped directly inside our secure storage vaults, completely decoupling system files from the physical workspace partition.
3.  **Strict Connection Decoupling rules**: System database migrations for multi-tenant layers use modular paths to prevent layout modifications for Starter plans from interfering with enterprise databases.

---

**End of Document**
