# BhoomiOne V2 - Tenant Provisioning & Credentials Delivery Policy

This document establishes the official architecture and security policies for workspace admin creation, secure credential generation, password storage, and administration portal delivery in BhoomiOne V2.

## 1. Security & Storage Principles

1. **Server-Generated Secrets**: Temporary passwords must be generated entirely server-side using secure pseudo-random builders (`Str::random(12)`). No client-side pre-generation is permitted.
2. **One-Way Cryptographic Hashing**: Secrets must be stored in the primary `users` database solely in hashed format using standard bcrypt (via Laravel's `Hash::make()`).
3. **Single Exposure Constraint**: The unhashed temporary password is returned exactly **once** in the API payload response during successful provisioning. It is never logged in standard files, stored in secondary databases, or exposed in subsequent queries.
4. **Password Reset Requirement**: All newly provisioned admin users are created with `must_change_password = true`. Upon first-time login to their workspace domain, they must change their temporary credential.

## 2. Platform Audit Ledger

Every successful tenant provisioning must record a multi-stage auditable history in the centralized ledger. The five primary events generated are:

*   `tenant_created`: Logged with full workspace meta configurations, infrastructure tiers, and codes.
*   `domain_created`: Tracks domain records (type, primary status, active DNS) linked to the workspace.
*   `subscription_created`: Logs subscription parameters, initial plan levels, trial state intervals, and expiration boundaries.
*   `admin_user_created`: Logs user profile meta details (UUID, Name, Email, Phone) without password data.
*   `credentials_generated`: Documents secret allocation, forced password reset requirements, and recipient boundaries.

## 3. Credential Delivery Modes

To provide flexible, reliable operations under various infrastructure configurations, credentials are dispatched through a safe fallback pattern:

### Standard SMTP Mode (Default)
When valid mail delivery configuration exists (`config('mail.mailers.smtp.host')`), a welcome email containing the URL, email account, and temporary password is automatically sent to the administrator.

### Isolated/Local Fallback Mode
If SMTP keys are not configured or are set to localhost/127.0.0.1, mail transport is bypassed. The system captures the full email subject, destination, and body directly in standard Laravel application logs (`storage/logs/laravel.log`) for manual retrieve and verification:
```text
Welcome email logged (SMTP not configured):
To: admin@company.com
Subject: Welcome to BhoomiOne - Workspace Provisioned Successfully
...
```

## 4. UI Copy & Onboarding Flows

The SaaS Administration Suite implements an immediate-action credentials modal upon successful provisioning:
- **Workspace Access URL**: Pre-computed URL linking directly to the tenant's domain.
- **Admin Email**: The validated account email.
- **Temporary Password**: Bold mono display with immediate copy functionality.
- **Action Buttons**: Complete copy-to-clipboard for quick administrative handover and direct one-click workspace launching.
