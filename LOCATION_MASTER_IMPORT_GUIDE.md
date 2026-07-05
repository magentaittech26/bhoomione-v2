# India Location Master – Import Guide

This guide details the import strategy, idempotent seeder, and usage instructions for the `LocationImportService` in BhoomiOne V3.1.

## 1. Import Service Overview

The `LocationImportService` is designed to ingest massive hierarchical datasets from external CSV or JSON files safely and idempotently.

### Core Features

- **Normalization**: Normalizes text by removing double whitespaces and converting to standard title-casing.
- **Idempotency**: Safely runs multiple times without introducing duplicate records.
- **Transactions**: Employs database transactions to prevent half-imported, corrupted state trees.
- **Duplicate Prevention**: Prior to inserting, looks up existing parents by name and code to resolve relationships.

---

## 2. Dynamic Import Signature

### Service Class: `App\Services\LocationImportService`

```php
public function importHierarchy(array $statesData): array
```

### JSON Input Format Example

```json
[
  {
    "name": "Karnataka",
    "code": "KA",
    "type": "State",
    "latitude": 15.3173,
    "longitude": 75.7139,
    "source_ref": "Census 2011",
    "districts": [
      {
        "name": "Dharwad",
        "latitude": 15.4589,
        "longitude": 75.0078,
        "taluks": [
          {
            "name": "Hubli",
            "latitude": 15.3647,
            "longitude": 75.1240,
            "villages": [
              {
                "name": "Gokul Road",
                "latitude": 15.3725,
                "longitude": 75.1011,
                "pincode": "580030"
              }
            ]
          }
        ],
        "cities": [
          {
            "name": "Hubballi",
            "pincode": "580020",
            "latitude": 15.3647,
            "longitude": 75.1240
          }
        ]
      }
    ]
  }
]
```

---

## 3. Running the Seeder & Artisan Commands

The database is pre-seeded with all 28 states, 8 Union Territories, and detailed deep location hierarchies for Karnataka (Dharwad, Mysore, Bangalore, etc.), Maharashtra, and Haryana.

Run the seeder with:

```bash
php artisan db:seed --class=LocationMasterSeeder
```

The seeder can be run safely multiple times; it will automatically detect and match existing keys, updating details instead of generating duplicate records.
