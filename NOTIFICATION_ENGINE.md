# BhoomiOne V2 – Centralized Notification & Alerts Engine

This document details the production-ready centralized **Notification & Alerts Engine** implemented for BhoomiOne V2. It handles multi-channel, non-blocking, asynchronous template transmissions, automated queue sweeps, and manual retry ledger logging.

---

## 1. Architectural Overview

The Notification Engine acts as a centralized communications hub that abstracts provider-specific SDKs and APIs. When any business domain triggers an event (e.g., booking confirmed or EMI reminder due), the engine translates variables into compiled templates and enqueues transmission records.

```
       [ Business Event Trigger ]
                   │
                   ▼
     [ NotificationService.dispatch() ]
                   │
    ┌──────────────┴──────────────┐
    ▼                             ▼
[ compile variables ]      [ write to notification_logs ]
                                  │
                                  ▼
                     [ asynchronous setImmediate() ]
                                  │
                                  ▼
                   [ processLogId() Gateway Outbound ]
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
       [ Email Client ]     [ SMS Client ]     [ WhatsApp API ]
         (SMTP / SES)       (Twilio / Plivo)    (Twilio / Meta)
```

### Key Pillars
- **Asynchronous Execution**: In keeping with performance requirements, dispatches are enqueued and processed on a background thread (`setImmediate`), meaning that communication network delays never interrupt tenant or business workflows.
- **Fail-Safe Integrity**: Transmission failures (e.g. gateway timeout or invalid recipient address) trigger automatic state transitions to `FAILED` with retry logs. Failures never interrupt transactional operations.
- **Multi-Channel Templates**: A single event template defines content blocks for all supported communication channels simultaneously.

---

## 2. Supported Channels & Gateway Integration

The engine implements dynamic parameter mapping for **6 core communication channels** across industry-leading providers:

1. **Email (EMAIL)**
   - *SMTP*: Host, port, TLS/SSL encryption, username, password, sender headers.
   - *Amazon SES*: Region, IAM Access Key ID, and Secret Access Key.
2. **SMS (SMS)**
   - *Twilio SMS*: Account SID, Auth Token, and Sender ID.
   - *Plivo SMS*: Auth ID, Auth Token, and Sender ID.
3. **WhatsApp (WHATSAPP)**
   - *Twilio WhatsApp*: Account SID, Auth Token, and Sender Phone Number.
   - *Meta Cloud API*: Phone Number ID, Business Account ID, and Access Token.
4. **Push Notifications (PUSH)**
   - *Firebase Cloud Messaging (FCM)*: Project ID, Client Email, Private Key, and Messaging Sender ID.
5. **In-App Alerts (IN_APP)**
   - *System Notification Center Ledger*: Directly populates the global in-app notification list with target user IDs.
6. **Webhooks (WEBHOOK)**
   - *Global Webhook Hub*: Dispatches custom JSON payloads to client-registered target URLs with optional signing secret headers.

---

## 3. Database Schema Definitions

The Notification Engine utilizes three relational PostgreSQL tables:

```sql
-- 1. NOTIFICATION_CONFIGURATIONS
CREATE TABLE IF NOT EXISTS notification_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(50) NOT NULL, -- 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP', 'WEBHOOK'
  provider_code VARCHAR(50) NOT NULL, -- 'SMTP', 'TWILIO_SMS', 'PLIVO', 'TWILIO_WA', 'META_WA', 'FCM', 'IN_APP_SYSTEM', 'GENERIC_WEBHOOK'
  name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  config_params JSONB DEFAULT '{}'::jsonb, -- Store secret API keys, hosts, ports, headers
  status VARCHAR(50) DEFAULT 'INACTIVE', -- 'ACTIVE', 'INACTIVE', 'FAILED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_channel_provider UNIQUE (channel, provider_code)
);

-- 2. NOTIFICATION_TEMPLATES
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) UNIQUE NOT NULL, -- 'TENANT_CREATED', 'BOOKING', 'PAYMENT', etc.
  name VARCHAR(150) NOT NULL,
  email_subject VARCHAR(255) NULL,
  email_body_html TEXT NULL,
  sms_template TEXT NULL,
  whatsapp_template TEXT NULL,
  push_title VARCHAR(255) NULL,
  push_body TEXT NULL,
  in_app_body TEXT NULL,
  webhook_payload_template TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. NOTIFICATION_LOGS
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL, -- 'EMAIL', 'SMS', etc.
  recipient VARCHAR(255) NOT NULL, -- Email, phone number, token, user_id, or URL
  subject VARCHAR(255) NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'DELIVERED', 'FAILED', 'SCHEDULED'
  retry_count INTEGER DEFAULT 0 NOT NULL,
  max_retries INTEGER DEFAULT 3 NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE NULL,
  error_message TEXT NULL,
  audit_trail JSONB DEFAULT '[]'::jsonb, -- Array of timeline event logs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at DESC);
```

---

## 4. Supported Business Events

The engine registers specialized layout templates for **11 critical transactional events**:

| Event Type | Business Scenario | Channel Payload Formats |
| :--- | :--- | :--- |
| `TENANT_CREATED` | SaaS Workspace onboarding | Email welcome letter + Provisioning SMS/WA |
| `BOOKING` | Land plot unit reserved | Customer confirmation with plot name variables |
| `PAYMENT` | Payment confirmation received | Invoice balance updates and receipt ledger posts |
| `INVOICE` | Installment demand compiled | Link to checkout portals and digital copy attachments |
| `RECEIPT` | Tax receipt issued | Tax summaries, TDS breakdowns, stamp duties |
| `AGREEMENT` | Draft Sale agreement ready | Digital signing links and execution reminders |
| `EMI_REMINDER` | Upcoming installment notice | SMS/Email/WhatsApp reminder series |
| `SUBSCRIPTION_RENEWAL` | SaaS billing term ending | Portal owner renewal reminders and pricing details |
| `LEAD_ASSIGNMENT` | Sales lead designated to agent | High-priority In-App assignment alerts |
| `SITE_VISIT` | Physical location tour scheduled | Assistant details, timings, and map coordinates |
| `ADMIN_ALERTS` | Critical exceptions / telemetry | Security telemetry and threshold warnings |

---

## 5. API Endpoints Specification

All routes are mounted under the `/api/v1` prefix and protected by the `requireAuth` administrator policy:

- `GET /admin/notifications/configurations`
  - Fetches registered configurations across all 6 channels.
- `POST /admin/notifications/configurations`
  - Creates or updates gateway configurations (enables/disables routes, toggles defaults).
- `POST /admin/notifications/test-gateway`
  - Executes immediate connection handshake validation for the specified credentials.
- `GET /admin/notifications/templates`
  - Retrieves the transactional template catalogue.
- `POST /admin/notifications/templates`
  - Updates multi-channel templates with upsert execution.
- `GET /admin/notifications/logs`
  - Returns the comprehensive transmission history ledger.
- `POST /admin/notifications/retry/:id`
  - Resets a failed log back to `QUEUED` to re-trigger the background execution loop.
- `POST /admin/notifications/send-test`
  - Simulates direct variable compiler interpolation and enqueues a live test alert.
- `POST /admin/notifications/sweep`
  - Manually sweeps the queue to dispatch overdue scheduled alerts or retry failures.

---

## 6. Real-Time Administrative Console

The **Notification & Alerts Console** is integrated directly into the `SaaS Settings Tab` of the administrator portal, grouping configuration and logs into a single visual panel:

1. **Gateway Routers Tab**: Select channels, edit credential profiles, toggle active status, and execute gateway connection tests.
2. **Central Templates Tab**: An intuitive dropdown template manager allows customizing specific email, SMS, WA, Push, In-App, and Webhook templates inside the same event structure.
3. **Outbound Ledger Tab**: View chronological dispatches, search logs by recipient/body, and drill down into collapsible timelines showing the exact audit trail, hops, latencies, and gateway error dumps.
4. **Test Sandbox Tab**: Simulate any event trigger, select channels, enter test targets, compile custom JSON variables, and queue dispatches instantly.
