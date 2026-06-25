# Disaster Recovery & Rollback Playbook

This playbook outlines step-by-step procedures to revert system states, recover databases, and roll back deployment containers during critical production failures.

---

## 📦 Container Rollback (Cloud Run)

In the event of critical server crashes or bad API merges:
1. **Identify Stable Build**: Navigate to the container registry and identify the last known stable Docker digest hash (e.g. `gcr.io/bhoomione/app@sha256:...`).
2. **Execute Rollback**: Re-route Cloud Run traffic variables to point 100% to the target revision instantly:
  ```bash
  gcloud run services update bhoomione-service --image gcr.io/bhoomione/app:stable-tag --region asia-southeast1
  ```

---

## 🗄️ Database Reversion (PostgreSQL Migrations)

If a bad migration corrupted table schemas:
1. **Revert Migration**: Issue Artisan rollback scripts to remove the targeted table structure:
  ```bash
  php artisan migrate:rollback --step=1
  ```
2. **Restore Snapshots**: If database records were corrupted, execute transactional snapshot restoration from the automated hourly logical backups.
