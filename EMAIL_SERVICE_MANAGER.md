# BhoomiOne V2 – Email Service Manager (SMTP & REST APIs)

## Objective
Implement a production-grade Email Service Manager to replace the temporary file logging fallback with real, persistent, and configurable multi-provider email integration.

---

## Architecture Design

### 1. Failsafe Non-Blocking Queue Execution
To ensure that **mail delivery failures never interrupt tenant workspace provisioning or critical transactions**, the communications engine decouples the email dispatch from the primary execution thread. 

When an email request is initialized:
1. It is immediately registered as `QUEUED` in the `email_logs` table.
2. The REST API immediately returns a success status back to the client/caller.
3. The queue processor is triggered asynchronously on a non-blocking macro-task event loop (`setImmediate`), guaranteeing that the parent process completes instantaneously and safely without waiting for remote SMTP/API connection handshakes.

---

## Database Schemas

### 1. `email_configurations` Table
Stores credentials, API keys, endpoints, and statuses for each outbound node.
```sql
CREATE TABLE email_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_code VARCHAR(32) UNIQUE NOT NULL, -- e.g. 'SMTP', 'SES', 'MAILGUN', etc.
    name VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    host VARCHAR(255),
    port INT,
    encryption VARCHAR(16), -- 'TLS', 'SSL', 'NONE'
    username VARCHAR(255),
    password VARCHAR(255), -- Encoded credentials or API keys
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    custom_params JSONB DEFAULT '{}'::jsonb, -- Mailgun domains, AWS region, Google Client IDs
    status VARCHAR(32) DEFAULT 'INACTIVE', -- 'ACTIVE', 'INACTIVE', 'FAILED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. `email_templates` Table
Houses the HTML layouts and subject lines for transactional emails.
```sql
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'WELCOME', 'PASSWORD_RESET'
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. `email_logs` Table
A centralized ledger log of all outbound emails, tracking queue statuses and error exceptions.
```sql
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_code VARCHAR(32) NOT NULL,
    template_key VARCHAR(64),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'QUEUED', -- 'QUEUED', 'DELIVERED', 'BOUNCED', 'FAILED'
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Supported Providers & Integration

| Code | Provider Name | Configuration Parameters |
|:---|:---|:---|
| **SMTP** | Central SMTP Relay | Host, Port, Username, Password, Encryption (TLS/SSL) |
| **SES** | Amazon SES Gateway | AWS Access Key ID, AWS Secret Access Key, Regional Endpoint |
| **MAILGUN** | Mailgun API Relay | Sending Domain, API Auth Key, US/EU Region Endpoint |
| **SENDGRID** | SendGrid Delivery Engine | API Key, Outbound Sender Mask |
| **BREVO** | Brevo (formerly Sendinblue) | SMTP Credentials / API Keys |
| **ZOHO** | Zoho Mail Relaying | Zoho Host, Port, Secure Outbound SMTP Pass |
| **OFFICE365** | Microsoft 365 Exchange | Microsoft Exchange Auth Credentials, Port 587 (TLS) |
| **GMAIL_OAUTH**| Gmail REST API OAuth 2.0 | OAuth Client ID, OAuth Client Secret, Refresh Token |

---

## Transactional Email Templates
The system seeds and maintains 7 required templates out-of-the-box:
1. **WELCOME (`WELCOME`):** Welcome greeting for new accounts.
2. **PASSWORD_RESET (`PASSWORD_RESET`):** Secure reset links with expirations.
3. **TENANT_PROVISIONED (`TENANT_PROVISIONED`):** Notifies builder portals that workspaces are active.
4. **SUBSCRIPTION (`SUBSCRIPTION`):** Confirms plan upgrades and subscription status updates.
5. **INVOICE (`INVOICE`):** New invoice generations with itemized cost metrics.
6. **RECEIPT (`RECEIPT`):** Payments receipts referencing transactions.
7. **VERIFICATION (`VERIFICATION`):** OTP verification codes.

---

## API Endpoints Reference

### 1. Configurations
- `GET /api/v1/admin/email-service/configurations` — Retrieves all gateways.
- `POST /api/v1/admin/email-service/configurations` — Save/Update a single provider configuration.

### 2. Live Connection Tests
- `POST /api/v1/admin/email-service/test-connection` — Performs connection handshake checks. If successful, updates status to `ACTIVE`, otherwise `FAILED`.

### 3. Test Email Deliverability
- `POST /api/v1/admin/email-service/send-test` — Appends a test email payload directly into the non-blocking queue.

### 4. Templates
- `GET /api/v1/admin/email-service/templates` — Fetch all transactional templates.
- `POST /api/v1/admin/email-service/templates` — Live-update customized templates.

### 5. Delivery Logs & Queue Checks
- `GET /api/v1/admin/email-service/logs` — Fetch all delivered, bounced, queued, and failed logs.
- `POST /api/v1/admin/email-service/retry/:id` — Reset retry attempts and re-queue failed logs in background immediately.
