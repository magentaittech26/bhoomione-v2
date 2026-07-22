# BhoomiOne V3 — Canonical Permission Registry

## Overview
This registry defines all canonical permission codes implemented across the BhoomiOne V3 platform.

| Permission Code | Module | Description | Default Roles |
|---|---|---|---|
| `masters.measurement_units.view` | `masters` | View measurement units registry and definitions | All Roles |
| `masters.measurement_units.create` | `masters` | Create new standard measurement units | Admin, Owner |
| `masters.measurement_units.edit` | `masters` | Modify existing measurement units | Admin, Owner |
| `masters.measurement_units.delete` | `masters` | Soft delete measurement unit definitions | Owner |
| `masters.measurement_units.activate` | `masters` | Toggle active status of measurement units | Admin, Owner |
| `masters.measurement_units.export` | `masters` | Export measurement unit datasets | Admin, Owner, PM, Sales |
| `masters.measurement_units.import` | `masters` | Import measurement unit definitions | Admin, Owner |
| `projects.view` | `projects` | View development projects | All Roles |
| `projects.create` | `projects` | Create new development projects | Owner, Admin, PM |
| `projects.edit` | `projects` | Edit project attributes and configurations | Owner, Admin, PM |
| `projects.archive` | `projects` | Archive development projects | Owner |
| `projects.restore` | `projects` | Restore archived projects | Owner |
| `projects.delete` | `projects` | Delete development projects | Owner |
| `projects.manage` | `projects` | Full administrative control over projects | Owner, Admin |
| `layouts.view` | `projects` | View layout blueprints | All Roles |
| `layouts.create` | `projects` | Create layout blueprints | Owner, Admin, PM |
| `layouts.edit` | `projects` | Modify layout blueprints | Owner, Admin, PM |
| `layouts.archive` | `projects` | Archive layout blueprints | Owner |
| `layouts.restore` | `projects` | Restore archived layouts | Owner |
| `layouts.delete` | `projects` | Delete layout blueprints | Owner |
| `layouts.approve` | `projects` | Approve layout blueprints for staging | Owner, Admin |
| `layouts.publish` | `projects` | Publish layout blueprints to production | Owner, Admin |
| `layouts.manage` | `projects` | Full management of layout blueprints | Owner, Admin |
| `maps.view` | `gis` | View GIS map layers and spatial features | All Roles |
| `maps.edit` | `gis` | Edit GIS map layers and features | Owner, Admin, PM, Surveyor |
| `maps.draw` | `gis` | Draw spatial geometries on maps | Owner, Admin, Surveyor |
| `maps.validate` | `gis` | Validate GIS spatial topology | Owner, Admin, Surveyor |
| `maps.publish` | `gis` | Publish interactive maps | Owner |
| `maps.upload` | `gis` | Upload spatial map files | Owner, Admin, PM, Surveyor |
| `plots.view` | `projects` | View plot grid and dimensions | All Roles |
| `plots.create` | `projects` | Create individual plot records | Owner, Admin, PM, Surveyor |
| `plots.edit` | `projects` | Edit plot attributes and pricing | Owner, Admin, PM, Surveyor |
| `plots.delete` | `projects` | Delete plot records | Owner |
| `plots.generate` | `projects` | Auto-generate plots from layout grid | Owner, Admin, PM, Surveyor |
| `plots.split` | `projects` | Split existing plot into sub-plots | Owner, Surveyor |
| `plots.merge` | `projects` | Merge adjacent plots | Owner, Surveyor |
| `plots.number` | `projects` | Re-number and sequence plot inventory | Owner, Admin, PM, Surveyor |
| `plots.validate` | `projects` | Validate plot boundary geometry | Owner, Admin, PM, Surveyor |
| `plots.manage` | `projects` | Full administrative control over plots | Owner, Admin |
| `rbac.roles.view` | `identity` | View role structures and assignments | Owner, Admin |
| `rbac.roles.create` | `identity` | Create custom tenant roles | Owner, Admin |
| `rbac.roles.edit` | `identity` | Edit role names and permissions | Owner, Admin |
| `rbac.roles.delete` | `identity` | Delete custom tenant roles | Owner |
| `rbac.permissions.view` | `identity` | View permission registry | Owner, Admin |
| `rbac.users.assign_roles` | `identity` | Assign roles to workspace users | Owner, Admin |
| `rbac.audit.view` | `identity` | View RBAC security audit log | Owner |
