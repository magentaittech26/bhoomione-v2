# BhoomiOne V2 – Seeder Guidelines

To ensure the platform metadata layer remains highly stable, reliable, and free from foreign key or primary key violation risks, all developers must adhere to the following seeding conventions.

---

## 1. The Core Seeding Rules

All database seeders initializing master records must strictly comply with these five rules:

1.  **Never Use UUIDs as Lookups:** Lookup records using their stable, immutable natural business keys (e.g., `code`, `plan_code`, `setting_key`, or composite keys like `plan_id` + `limit_key`).
2.  **Only Update Mutable Columns:** If a record already exists, update only columns that are allowed to change (e.g., `name`, `description`, `status`, `sort_order`, `limit_value`).
3.  **Never Touch Immutable Primary/Foreign Keys during Update:** Do not pass the `id` or foreign keys in the update array. Even updating a column to its existing value triggers integrity checks in PostgreSQL and can lead to violations.
4.  **Insert with Fresh UUIDs Only When Missing:** If a record is not found, generate a new UUID on-the-fly and insert the record as a complete row.
5.  **No Deletions or Recreations:** Never clear or truncate master data tables inside metadata seeders. Master data must never be orphaned.

---

## 2. Recommended Implementation: `safeSeedComposite`

Instead of raw `updateOrCreate` calls, implement the following idempotent method in your seeder classes:

```php
/**
 * Safely seeds a master record.
 * Updates mutable columns only if the record exists; inserts a new record if missing.
 * NEVER regenerates UUIDs or updates immutable columns/keys.
 */
private function safeSeedComposite($modelClass, array $lookupConditions, array $mutableData, array $immutableData = [])
{
    $record = $modelClass::where($lookupConditions)->first();

    if ($record) {
        $record->fill($mutableData);
        if ($record->isDirty()) {
            $record->save();
        }
        return $record;
    }

    $newRecordData = array_merge([
        'id' => (string) \Illuminate\Support\Str::uuid(),
    ], $lookupConditions, $immutableData, $mutableData);

    return $modelClass::create($newRecordData);
}
```

### Examples

#### Example A: Single Business Key (e.g., `SaasModule`)
```php
$this->safeSeedComposite(
    SaasModule::class,
    ['code' => 'PROJECTS'],
    [
        'name' => 'Projects Module',
        'group' => 'Core Development',
        'description' => 'Real estate development project registration',
        'status' => 'ACTIVE'
    ]
);
```

#### Example B: Composite Keys (e.g., `SubscriptionPlanLimit`)
```php
$this->safeSeedComposite(
    SubscriptionPlanLimit::class,
    ['plan_id' => $planId, 'limit_key' => 'usersLimit'],
    ['limit_value' => 5]
);
```
