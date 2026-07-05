# India Location Master – Module Architecture

This document describes the schema design, hierarchical relationships, and design decisions for the global **India Location Master Module** in BhoomiOne V3.1.

## 1. Schema Design

The Location Master is built as a shared master data service to prevent duplicate geo-entries across projects, billing, marketplace, and inventory items.

```
+--------------------+
|  location_states   |
+--------------------+
          | (1:N)
+--------------------+
| location_districts |
+--------------------+
          | (1:N)
+--------------------+
|  location_taluks   |
+--------------------+
          | (1:N)
+--------------------+
| location_villages  | <-----+
+--------------------+       |
                             | (1:N or nullable links)
+--------------------+       |
| location_cities    | <-----+
+--------------------+       |
          |                  |
          +--------+---------+
                   |
         +-------------------+
         | location_pincodes |
         +-------------------+
```

### Table Definitions & Primary Columns

1. **`location_states`**: Stores the 28 States and 8 Union Territories of India.
   - `id` (bigint, PK)
   - `name` (string, 100)
   - `code` (string, 10, unique) - ISO/standard abbreviation (e.g., `KA`, `MH`)
   - `type` (string, 50) - Defaults to `'State'` or `'Union Territory'`
   - `latitude`, `longitude` (decimal, 10,7)
   - `is_active` (boolean)
   - `source_ref` (string, 100)

2. **`location_districts`**: Stores districts.
   - `id` (bigint, PK)
   - `state_id` (foreign key -> `location_states.id`)
   - `name` (string, 100)
   - `latitude`, `longitude` (decimal, 10,7)
   - `is_active` (boolean)

3. **`location_taluks`**: Taluk / Tehsil / Block subdivisions.
   - `id` (bigint, PK)
   - `district_id` (foreign key -> `location_districts.id`)
   - `name` (string, 100)
   - `latitude`, `longitude` (decimal, 10,7)
   - `is_active` (boolean)

4. **`location_cities`**: Cities, Towns, and major Urban Clusters.
   - `id` (bigint, PK)
   - `district_id` (foreign key -> `location_districts.id`)
   - `name` (string, 100)
   - `latitude`, `longitude` (decimal, 10,7)
   - `is_active` (boolean)

5. **`location_villages`**: Villages, Localities, and Rural sectors.
   - `id` (bigint, PK)
   - `taluk_id` (foreign key -> `location_taluks.id`)
   - `name` (string, 100)
   - `latitude`, `longitude` (decimal, 10,7)
   - `is_active` (boolean)

6. **`location_pincodes`**: Index of 6-digit Indian Postal Codes mapped to cities and villages.
   - `id` (bigint, PK)
   - `pincode` (string, 20)
   - `city_id` (nullable foreign key -> `location_cities.id`)
   - `village_id` (nullable foreign key -> `location_villages.id`)
   - `latitude`, `longitude` (decimal, 10,7)
   - `is_active` (boolean)

---

## 2. Performance & Index Optimization

To handle high-volume database reads, the following indices are applied:
- **Foreign Keys**: Index on `state_id`, `district_id`, `taluk_id`, `city_id`, `village_id`
- **Pincode Lookup**: Index on `pincode` field
- **Fuzzy Search Indices**: Normalized name strings and lowercase comparisons (`ilike` ready)
- **Active Filter**: Composite indices with `is_active` to filter out retired locations.
