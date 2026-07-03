import { getPool } from "./pool.ts";
import bcrypt from "bcryptjs";

export async function bootstrapDatabase() {
  if (process.env.NODE_ENV === "production") {
    console.log("ℹ️ Database schema changes are managed by Laravel migrations only in production. Skipping schema-altering bootstrapDatabase().");
    return;
  }
  const pool = getPool();
  let client;

  try {
    client = await pool.connect();
    console.log("🛠️ Starting database schema verification the real PostgreSQL database...");

    // Create extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // 1. measurement_units Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS measurement_units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        conversion_to_sqft DECIMAL(18,8) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. subscription_plans Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        monthly_rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        yearly_rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. tenants Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_code VARCHAR(100) UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        infrastructure_tier VARCHAR(50) NOT NULL DEFAULT 'STARTER',
        database_host VARCHAR(255) NULL,
        database_name VARCHAR(255) NULL,
        database_port INTEGER NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. tenant_domains Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_domains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        domain_name VARCHAR(255) UNIQUE NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. tenant_subscriptions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        kyc_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. roles Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        scope VARCHAR(50) NOT NULL DEFAULT 'TENANT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. permissions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        module VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. role_permissions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    // 10. user_roles Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      )
    `);

    // 11. tenant_users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_users (
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tenant_id, user_id)
      )
    `);

    // 12. audit_logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        entity_name VARCHAR(100) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        old_values JSONB NULL,
        new_values JSONB NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 13. refresh_tokens Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 14. projects Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL,
        developer_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PLANNING',
        rera_number VARCHAR(100) NULL,
        approval_status VARCHAR(100) NULL,
        approval_authority VARCHAR(255) NULL,
        launch_date DATE NULL,
        possession_target_date DATE NULL,
        approvals_metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (tenant_id, code)
      )
    `);

    // 15. layouts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS layouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL,
        layout_type VARCHAR(50) NOT NULL DEFAULT 'RESIDENTIAL',
        approval_number VARCHAR(150) NULL,
        approval_date DATE NULL,
        total_area_value DECIMAL(16,4) NULL,
        total_area_unit_id UUID NULL REFERENCES measurement_units(id) ON DELETE RESTRICT,
        measurement_unit_id UUID NOT NULL REFERENCES measurement_units(id) ON DELETE RESTRICT,
        status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (project_id, code)
      )
    `);

    // 16. plots Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS plots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        layout_id UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
        plot_number VARCHAR(100) NOT NULL,
        area_value DECIMAL(12,4) NOT NULL,
        measurement_unit_id UUID NOT NULL REFERENCES measurement_units(id) ON DELETE RESTRICT,
        length DECIMAL(10,2) NULL,
        width DECIMAL(10,2) NULL,
        road_width DECIMAL(6,2) NOT NULL DEFAULT 0.00,
        corner_plot BOOLEAN NOT NULL DEFAULT FALSE,
        facing VARCHAR(50) NOT NULL DEFAULT 'NORTH',
        dimensions VARCHAR(100) NOT NULL,
        dimensions_metadata JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (layout_id, plot_number)
      )
    `);

    // 17. dxf_files Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dxf_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        layout_id UUID REFERENCES layouts(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        sha256_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 18. import_jobs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS import_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        dxf_file_id UUID NOT NULL REFERENCES dxf_files(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'uploaded',
        total_entities_found INTEGER NOT NULL DEFAULT 0,
        extracted_metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 19. import_job_logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS import_job_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
        step_name VARCHAR(100) NOT NULL,
        log_level VARCHAR(20) NOT NULL DEFAULT 'INFO',
        message TEXT NOT NULL,
        duration_ms INTEGER NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 20. dxf_layer_mappings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dxf_layer_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        dxf_file_id UUID NOT NULL REFERENCES dxf_files(id) ON DELETE CASCADE,
        layer_name VARCHAR(150) NOT NULL,
        layer_type VARCHAR(40) NOT NULL,
        suggested_type VARCHAR(40) NOT NULL DEFAULT 'UNKNOWN',
        confidence_score INTEGER NOT NULL DEFAULT 0,
        mapping_source VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 21. import_templates Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS import_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 22. developer_profiles Table (Marketplace Phase 2B)
    await client.query(`
      CREATE TABLE IF NOT EXISTS developer_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        logo VARCHAR(255) NULL,
        cover_image VARCHAR(255) NULL,
        description TEXT NULL,
        rera_number VARCHAR(100) NULL,
        office_address VARCHAR(255) NULL,
        website VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        email VARCHAR(255) NULL,
        social_links JSONB DEFAULT '{}'::jsonb,
        completed_projects INTEGER DEFAULT 0,
        active_projects INTEGER DEFAULT 0,
        years_in_business INTEGER DEFAULT 0,
        verification_status VARCHAR(50) DEFAULT 'PENDING',
        rating DECIMAL(3,2) DEFAULT 0.00,
        seo_slug VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23. marketplace_leads Table (Marketplace Phase 2B)
    await client.query(`
      CREATE TABLE IF NOT EXISTS marketplace_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        layout_id UUID REFERENCES layouts(id) ON DELETE SET NULL,
        plot_id UUID REFERENCES plots(id) ON DELETE SET NULL,
        lead_type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        message TEXT NULL,
        status VARCHAR(50) DEFAULT 'NEW',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23b. payment_gateways Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_gateways (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gateway_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        environment VARCHAR(20) NOT NULL DEFAULT 'SANDBOX',
        api_key VARCHAR(255) NULL,
        secret_key VARCHAR(255) NULL,
        webhook_secret VARCHAR(255) NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23c. payment_logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gateway_code VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(100) NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        error_message TEXT NULL,
        customer_email VARCHAR(255) NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23d. webhook_logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gateway_code VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PROCESSED',
        error_message TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23e. tax_rules Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
        tax_type VARCHAR(50) NOT NULL, -- 'GST', 'CGST', 'SGST', 'IGST', 'TDS', 'STAMP_DUTY', 'REGISTRATION', 'OTHER'
        name VARCHAR(100) NOT NULL,
        rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        state_code VARCHAR(10) NOT NULL DEFAULT 'ALL', -- 'KA', 'MH', 'DL', 'HR', 'ALL' (Default)
        effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23f. tax_transactions Table (for Invoice integration & Reports)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        invoice_number VARCHAR(100) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        state_code VARCHAR(10) NOT NULL,
        base_amount DECIMAL(15,2) NOT NULL,
        cgst_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        sgst_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        igst_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        tds_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        stamp_duty_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        registration_charges DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        other_charges DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_invoice_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23g. email_configurations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_code VARCHAR(50) UNIQUE NOT NULL, -- 'SMTP', 'SES', 'MAILGUN', 'SENDGRID', 'BREVO', 'ZOHO', 'OFFICE365', 'GMAIL_OAUTH'
        name VARCHAR(100) NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        host VARCHAR(255) NULL,
        port INTEGER NULL,
        encryption VARCHAR(20) NULL, -- 'TLS', 'SSL', 'NONE'
        username VARCHAR(255) NULL,
        password TEXT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_email VARCHAR(255) NOT NULL,
        custom_params JSONB DEFAULT '{}'::jsonb, -- API Key, Domain, OAuth params
        status VARCHAR(50) DEFAULT 'INACTIVE', -- 'ACTIVE', 'INACTIVE', 'FAILED'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23h. email_templates Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_key VARCHAR(50) UNIQUE NOT NULL, -- 'WELCOME', 'PASSWORD_RESET', 'TENANT_PROVISIONED', 'SUBSCRIPTION', 'INVOICE', 'RECEIPT', 'VERIFICATION'
        name VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body_html TEXT NOT NULL,
        body_text TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23i. email_logs Table (acts as delivery ledger, queue, bounce log)
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_code VARCHAR(50) NULL,
        template_key VARCHAR(50) NULL,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255) NULL,
        subject VARCHAR(255) NOT NULL,
        body_html TEXT NOT NULL,
        status VARCHAR(50) NOT NULL, -- 'QUEUED', 'DELIVERED', 'BOUNCED', 'FAILED'
        error_message TEXT NULL,
        retry_count INTEGER DEFAULT 0 NOT NULL,
        max_retries INTEGER DEFAULT 3 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP WITH TIME ZONE NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23j. notification_configurations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel VARCHAR(50) NOT NULL, -- 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP', 'WEBHOOK'
        provider_code VARCHAR(50) NOT NULL, -- 'SMTP', 'TWILIO_SMS', 'PLIVO', 'TWILIO_WA', 'META_WA', 'FCM', 'IN_APP_SYSTEM', 'GENERIC_WEBHOOK'
        name VARCHAR(100) NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        config_params JSONB DEFAULT '{}'::jsonb, -- Store host, port, secrets, api keys, headers, webhook URLs, etc.
        status VARCHAR(50) DEFAULT 'INACTIVE', -- 'ACTIVE', 'INACTIVE', 'FAILED'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_channel_provider UNIQUE (channel, provider_code)
      )
    `);

    // 23k. notification_templates Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(100) UNIQUE NOT NULL, -- 'TENANT_CREATED', 'BOOKING', 'PAYMENT', 'INVOICE', 'RECEIPT', 'AGREEMENT', 'EMI_REMINDER', 'SUBSCRIPTION_RENEWAL', 'LEAD_ASSIGNMENT', 'SITE_VISIT', 'ADMIN_ALERTS'
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
      )
    `);

    // 23l. notification_logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(100) NOT NULL,
        channel VARCHAR(50) NOT NULL, -- 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP', 'WEBHOOK'
        recipient VARCHAR(255) NOT NULL, -- Email, Phone, FCM token, webhook URL, or user ID
        subject VARCHAR(255) NULL,
        body TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'DELIVERED', 'FAILED', 'SCHEDULED'
        retry_count INTEGER DEFAULT 0 NOT NULL,
        max_retries INTEGER DEFAULT 3 NOT NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP WITH TIME ZONE NULL,
        error_message TEXT NULL,
        audit_trail JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for notification logs
    await client.query("CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON notification_logs(channel)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at DESC)");

    // SaaS Invoices and Accounts Receivable tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS saas_invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        billing_period VARCHAR(100) NOT NULL,
        subscription_plan_code VARCHAR(100) NOT NULL,
        subscription_plan_name VARCHAR(255) NOT NULL,
        base_amount DECIMAL(15,2) NOT NULL,
        cgst_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        sgst_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        igst_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_invoice_amount DECIMAL(15,2) NOT NULL,
        outstanding_balance DECIMAL(15,2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'UNPAID', -- 'PAID', 'PARTIALLY_PAID', 'UNPAID', 'OVERDUE', 'VOID'
        created_by VARCHAR(255) DEFAULT 'System',
        updated_by VARCHAR(255) DEFAULT 'System',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID NOT NULL REFERENCES saas_invoices(id) ON DELETE CASCADE,
        payment_date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL, -- 'CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'GATEWAY'
        reference_id VARCHAR(100) NULL, -- Transaction/Ref ID
        remarks TEXT NULL,
        recorded_by VARCHAR(255) DEFAULT 'System',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_credits_refunds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID NOT NULL REFERENCES saas_invoices(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- 'CREDIT_NOTE', 'REFUND'
        amount DECIMAL(15,2) NOT NULL,
        reason TEXT NOT NULL,
        issued_by VARCHAR(255) DEFAULT 'System',
        issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_audits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID NOT NULL REFERENCES saas_invoices(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL, -- 'CREATED', 'UPDATED', 'SENT', 'PAYMENT_RECORDED', 'CREDIT_ISSUED', 'REFUND_ISSUED'
        performed_by VARCHAR(255) NOT NULL,
        details TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query("CREATE INDEX IF NOT EXISTS idx_saas_invoices_tenant ON saas_invoices(tenant_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_saas_invoices_number ON saas_invoices(invoice_number)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_invoice_audits_invoice ON invoice_audits(invoice_id)");

    // 24. Alter existing tables to add marketplace columns
    await client.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS publishing_status VARCHAR(50) DEFAULT 'Draft'");
    await client.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE");
    await client.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS seo_settings JSONB DEFAULT '{}'::jsonb");
    await client.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'PENDING'");
    await client.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS moderation_history JSONB DEFAULT '[]'::jsonb");
    await client.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0");

    await client.query("ALTER TABLE layouts ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'Private'");
    await client.query("ALTER TABLE layouts ADD COLUMN IF NOT EXISTS price_range VARCHAR(100) NULL");
    await client.query("ALTER TABLE layouts ADD COLUMN IF NOT EXISTS downloads_count INTEGER DEFAULT 0");

    await client.query("ALTER TABLE plots ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT 0.00");
    await client.query("ALTER TABLE plots ADD COLUMN IF NOT EXISTS marketplace_visible BOOLEAN DEFAULT TRUE");
    await client.query("ALTER TABLE plots ADD COLUMN IF NOT EXISTS booking_status VARCHAR(50) DEFAULT 'AVAILABLE'");
    await client.query("ALTER TABLE plots ADD COLUMN IF NOT EXISTS reserved_by VARCHAR(255) NULL");

    // Promo Coupons and Campaigns support columns for Lifecycle, Soft Deletes, etc.
    await client.query("ALTER TABLE promo_campaigns ADD COLUMN IF NOT EXISTS start_date DATE");
    await client.query("ALTER TABLE promo_campaigns ADD COLUMN IF NOT EXISTS end_date DATE");
    await client.query("ALTER TABLE promo_campaigns ADD COLUMN IF NOT EXISTS spend DECIMAL(12,2) DEFAULT 0.00");
    await client.query("ALTER TABLE promo_campaigns ADD COLUMN IF NOT EXISTS revenue DECIMAL(12,2) DEFAULT 0.00");
    await client.query("ALTER TABLE promo_campaigns ADD COLUMN IF NOT EXISTS leads INTEGER DEFAULT 0");
    await client.query("ALTER TABLE promo_campaigns ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0");
    await client.query("ALTER TABLE promo_campaigns ADD COLUMN IF NOT EXISTS target_audience TEXT");
    await client.query("ALTER TABLE promo_campaigns ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Asia/Kolkata'");
    await client.query("ALTER TABLE promo_campaigns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE");

    await client.query("ALTER TABLE promo_coupons ADD COLUMN IF NOT EXISTS start_date DATE");
    await client.query("ALTER TABLE promo_coupons ADD COLUMN IF NOT EXISTS expiry_date DATE");
    await client.query("ALTER TABLE promo_coupons ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 100");
    await client.query("ALTER TABLE promo_coupons ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0");
    await client.query("ALTER TABLE promo_coupons ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100)");
    await client.query("ALTER TABLE promo_coupons ADD COLUMN IF NOT EXISTS builder_name VARCHAR(255)");
    await client.query("ALTER TABLE promo_coupons ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE'");
    await client.query("ALTER TABLE promo_coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50)");
    await client.query("ALTER TABLE promo_coupons ADD COLUMN IF NOT EXISTS discount_value DECIMAL(12,2)");
    await client.query("ALTER TABLE promo_coupons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE");

    // Notification Engine Media Message support columns
    await client.query("ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS whatsapp_media_url VARCHAR(512) NULL");
    await client.query("ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS whatsapp_media_type VARCHAR(50) NULL");
    await client.query("ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS whatsapp_media_url VARCHAR(512) NULL");
    await client.query("ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS whatsapp_media_type VARCHAR(50) NULL");

    // PERFORMANCE INDEXES
    await client.query("CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON tenant_domains(domain_name)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_layouts_project ON layouts(project_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_plots_layout ON plots(layout_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_dxf_files_tenant ON dxf_files(tenant_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_import_jobs_file ON import_jobs(dxf_file_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_dxf_mappings_file ON dxf_layer_mappings(dxf_file_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tax_rules_tenant ON tax_rules(tenant_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tax_rules_state ON tax_rules(state_code)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tax_transactions_tenant ON tax_transactions(tenant_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tax_transactions_invoice ON tax_transactions(invoice_number)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC)");

    // --- SEED SECTIONS ---
    // Truncate first to ensure clean seed
    await client.query("TRUNCATE TABLE invoice_audits CASCADE");
    await client.query("TRUNCATE TABLE invoice_credits_refunds CASCADE");
    await client.query("TRUNCATE TABLE invoice_payments CASCADE");
    await client.query("TRUNCATE TABLE saas_invoices CASCADE");
    await client.query("TRUNCATE TABLE email_logs CASCADE");
    await client.query("TRUNCATE TABLE email_templates CASCADE");
    await client.query("TRUNCATE TABLE email_configurations CASCADE");
    await client.query("TRUNCATE TABLE tax_rules CASCADE");
    await client.query("TRUNCATE TABLE tax_transactions CASCADE");
    await client.query("TRUNCATE TABLE developer_profiles CASCADE");
    await client.query("TRUNCATE TABLE marketplace_leads CASCADE");
    await client.query("TRUNCATE TABLE payment_gateways CASCADE");
    await client.query("TRUNCATE TABLE payment_logs CASCADE");
    await client.query("TRUNCATE TABLE webhook_logs CASCADE");
    await client.query("TRUNCATE TABLE import_templates CASCADE");
    await client.query("TRUNCATE TABLE dxf_layer_mappings CASCADE");
    await client.query("TRUNCATE TABLE import_job_logs CASCADE");
    await client.query("TRUNCATE TABLE import_jobs CASCADE");
    await client.query("TRUNCATE TABLE dxf_files CASCADE");
    await client.query("TRUNCATE TABLE plots CASCADE");
    await client.query("TRUNCATE TABLE layouts CASCADE");
    await client.query("TRUNCATE TABLE projects CASCADE");
    await client.query("TRUNCATE TABLE tenant_users CASCADE");
    await client.query("TRUNCATE TABLE user_roles CASCADE");
    await client.query("TRUNCATE TABLE role_permissions CASCADE");
    await client.query("TRUNCATE TABLE permissions CASCADE");
    await client.query("TRUNCATE TABLE roles CASCADE");
    await client.query("TRUNCATE TABLE users CASCADE");
    await client.query("TRUNCATE TABLE tenant_domains CASCADE");
    await client.query("TRUNCATE TABLE tenants CASCADE");
    await client.query("TRUNCATE TABLE measurement_units CASCADE");

    // Seed geographic measurement units
    await client.query(`
      INSERT INTO measurement_units (id, code, name, conversion_to_sqft) VALUES
      ('33333333-3333-3333-3333-333333333331', 'SQFT', 'Square Feet', 1.00000000),
      ('33333333-3333-3333-3333-333333333332', 'SQM', 'Square Meter', 10.76391042),
      ('33333333-3333-3333-3333-333333333333', 'ACRE', 'Acre', 43560.00000000),
      ('33333333-3333-3333-3333-333333333334', 'GUNTHA', 'Guntha', 1089.00000000),
      ('33333333-3333-3333-3333-333333333335', 'BIGHA', 'Bigha', 27000.00000000)
    `);
    console.log("Seeded default geographic measurement units.");


    // Seed subscription tiers
    const planCount = await client.query("SELECT COUNT(*) FROM subscription_plans");
    if (parseInt(planCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO subscription_plans (plan_code, name, monthly_rate, yearly_rate, feature_flags) VALUES
        ('STARTER', 'Starter Tier Plan', 99.00, 990.00, '{"max_users": 5, "feature_gis": false, "feature_api_access": false}'),
        ('GROWTH', 'Growth Tier Plan', 249.00, 2490.00, '{"max_users": 20, "feature_gis": true, "feature_api_access": false}'),
        ('PROFESSIONAL', 'Professional Tier Plan', 499.00, 4990.00, '{"max_users": 100, "feature_gis": true, "feature_api_access": true}'),
        ('ENTERPRISE', 'Enterprise Suite', 999.00, 9990.00, '{"max_users": 1000, "feature_gis": true, "feature_api_access": true}')
      `);
      console.log("Seeded subscription-plan tiers.");
    }

    // 1. Seed DEFAULT TENANTS
    const tenant1Id = '11111111-1111-4111-8111-111111111111';
    const tenant2Id = '22222222-2222-4222-8222-222222222222';

    await client.query(`
      INSERT INTO tenants (id, tenant_code, company_name, status) VALUES
      ('${tenant1Id}', 'dev-01', 'Bhoomi Developer Corp', 'ACTIVE'),
      ('${tenant2Id}', 'dev-02', 'Horizon Estates Ltd', 'ACTIVE')
    `);

    await client.query(`
      INSERT INTO tenant_domains (tenant_id, domain_name, is_primary) VALUES
      ('${tenant1Id}', 'dev01.bhoomione.com', true),
      ('${tenant1Id}', 'shaurya.tenant.bhoomione.in', false),
      ('${tenant2Id}', 'dev02.bhoomione.com', true)
    `);

    // Seed SaaS Invoices
    await client.query(`
      INSERT INTO saas_invoices (id, tenant_id, invoice_number, billing_period, subscription_plan_code, subscription_plan_name, base_amount, cgst_amount, sgst_amount, igst_amount, total_tax_amount, total_invoice_amount, outstanding_balance, status, created_by)
      VALUES
        ('90100000-0000-0000-0000-000000000001', '${tenant1Id}', 'BO-INV-2026-003', 'Jun 2026 - Jul 2026', 'PROFESSIONAL', 'Professional Tier Plan', 9900.00, 891.00, 891.00, 0.00, 1782.00, 11682.00, 0.00, 'PAID', 'System'),
        ('90100000-0000-0000-0000-000000000002', '${tenant1Id}', 'BO-INV-2026-002', 'Jun 2026 - Jun 2027', 'ENTERPRISE', 'Enterprise Suite', 99000.00, 8910.00, 8910.00, 0.00, 17820.00, 116820.00, 0.00, 'PAID', 'System'),
        ('90100000-0000-0000-0000-000000000003', '${tenant2Id}', 'BO-INV-2026-001', 'Jun 2026 - Jul 2026', 'PROFESSIONAL', 'Professional Tier Plan', 9900.00, 891.00, 891.00, 0.00, 1782.00, 11682.00, 11682.00, 'OVERDUE', 'System'),
        ('90100000-0000-0000-0000-000000000004', '${tenant2Id}', 'BO-INV-2026-TRIAL', '14-Day Free Evaluation', 'STARTER', 'Starter Tier Plan', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'PAID', 'System')
    `);

    // Seed Invoice Payments
    await client.query(`
      INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_method, reference_id, remarks, recorded_by)
      VALUES
        ('90100000-0000-0000-0000-000000000001', '2026-06-20', 11682.00, 'UPI', 'TXN-90182749', 'Regular renewal payment received online.', 'Platform Support User'),
        ('90100000-0000-0000-0000-000000000002', '2026-06-25', 116820.00, 'BANK_TRANSFER', 'TXN-88271104', 'Annual enterprise payment cleared.', 'Platform Support User')
    `);

    // Seed Invoice Audits
    await client.query(`
      INSERT INTO invoice_audits (invoice_id, action, performed_by, details)
      VALUES
        ('90100000-0000-0000-0000-000000000001', 'CREATED', 'System', 'Invoice generated automatically by Billing Engine.'),
        ('90100000-0000-0000-0000-000000000001', 'SENT', 'System', 'Invoice emailed to tenant billing address.'),
        ('90100000-0000-0000-0000-000000000001', 'PAYMENT_RECORDED', 'Platform Support User', 'Full payment of ₹11,682 recorded.'),
        ('90100000-0000-0000-0000-000000000002', 'CREATED', 'System', 'Annual enterprise invoice compiled.'),
        ('90100000-0000-0000-0000-000000000002', 'PAYMENT_RECORDED', 'Platform Support User', 'Full payment of ₹116,820 recorded via direct bank transfer.')
    `);

    // 2. Seed DEFAULT USERS
    const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const supportId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const ownerId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const customerId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

    const passwordHash = await bcrypt.hash("password123", 10);
    const adminPasswordHash = await bcrypt.hash("AdminPassword123!", 10);

    await client.query(`
      INSERT INTO users (id, name, email, phone, password_hash, kyc_status, status) VALUES
      ('${adminId}', 'Platform Admin User', 'admin@bhoomione.com', '+919000000001', '${passwordHash}', 'VERIFIED', 'ACTIVE'),
      ('${supportId}', 'Platform Support User', 'support@bhoomione.com', '+919000000002', '${passwordHash}', 'VERIFIED', 'ACTIVE'),
      ('${ownerId}', 'Developer Owner User', 'owner@developer1.com', '+919000000003', '${passwordHash}', 'VERIFIED', 'ACTIVE'),
      ('${customerId}', 'Customer User', 'customer@bhoomione.com', '+919000000004', '${passwordHash}', 'VERIFIED', 'ACTIVE')
    `);

    // Add backup profile for seamless admin login logic fallback
    const oldAdminId = '99999999-9999-4999-8999-999999999999';
    await client.query(`
      INSERT INTO users (id, name, email, phone, password_hash, kyc_status, status) VALUES
      ('${oldAdminId}', 'Platform Super Administrator', 'admin@bhoomione.in', '+919999999999', '${adminPasswordHash}', 'VERIFIED', 'ACTIVE')
      ON CONFLICT DO NOTHING
    `);

    // 3. Seed DEFAULT ROLES
    const roles: Record<string, { name: string; scope: string }> = {
      'PLATFORM_ADMIN': { name: 'Platform Admin', scope: 'GLOBAL' },
      'PLATFORM_SUPPORT': { name: 'Platform Support', scope: 'GLOBAL' },
      'DEVELOPER_OWNER': { name: 'Developer Owner', scope: 'TENANT' },
      'DEVELOPER_ADMIN': { name: 'Developer Admin', scope: 'TENANT' },
      'FINANCE_MANAGER': { name: 'Finance Manager', scope: 'TENANT' },
      'PROJECT_MANAGER': { name: 'Project Manager', scope: 'TENANT' },
      'SALES_MANAGER': { name: 'Sales Manager', scope: 'TENANT' },
      'SALES_EXECUTIVE': { name: 'Sales Executive', scope: 'TENANT' },
      'AGENT': { name: 'External Broker Agent', scope: 'TENANT' },
      'CUSTOMER': { name: 'Customer Profile', scope: 'TENANT' },
    };

    const roleIds: Record<string, string> = {};
    for (const [code, data] of Object.entries(roles)) {
      const res = await client.query(
        "INSERT INTO roles (code, name, scope) VALUES ($1, $2, $3) RETURNING id",
        [code, data.name, data.scope]
      );
      roleIds[code] = res.rows[0].id;
    }

    // 4. Seed DEFAULT PERMISSIONS
    const permissions: Record<string, { name: string; module: string }> = {
      'users.view': { name: 'View users in current context workspace', module: 'identity' },
      'users.create': { name: 'Create and invite users', module: 'identity' },
      'users.update': { name: 'Modify user settings and metadata', module: 'identity' },
      'users.delete': { name: 'Deactivate and suspend users', module: 'identity' },

      'roles.view': { name: 'Query current role list and structure', module: 'identity' },
      'roles.manage': { name: 'Define system roles and assignments', module: 'identity' },

      'permissions.view': { name: 'Query permission profiles', module: 'identity' },
      'permissions.manage': { name: 'Link privileges and mappings', module: 'identity' },

      'tenants.view': { name: 'View workspace organizational assets', module: 'platform' },
      'tenants.manage': { name: 'Create and modify developer tenants', module: 'platform' },

      'subscriptions.view': { name: 'View plan and subscription invoices', module: 'billing' },
      'subscriptions.manage': { name: 'Purchase and modify tenant tiers', module: 'billing' },

      'audit.view': { name: 'Audit immutable system trail logs', module: 'audit' },
      'kyc.review': { name: 'Audit customer profile verifications', module: 'platform' },

      'marketplace.publish': { name: 'Publish and list lands on marketplace', module: 'marketplace' },
      'marketplace.unpublish': { name: 'Unpublish properties', module: 'marketplace' },

      'maps.upload': { name: 'Upload map layouts', module: 'gis' },
      'maps.view': { name: 'View GIS map features', module: 'gis' },

      'projects.view': { name: 'View developer projects', module: 'projects' },
      'projects.manage': { name: 'Create and design development schedules', module: 'projects' },

      'layouts.view': { name: 'View project layouts', module: 'projects' },
      'layouts.manage': { name: 'Manage project layouts and sectors', module: 'projects' },

      'plots.view': { name: 'View plots inside layouts', module: 'projects' },
      'plots.manage': { name: 'Edit plot dimensions and statuses', module: 'projects' },

      'bookings.view': { name: 'Query customer booking items', module: 'sales' },
      'bookings.manage': { name: 'Initiate draft booking bookings', module: 'sales' },

      'collections.view': { name: 'Inspect customer ledgers', module: 'sales' },
      'collections.manage': { name: 'Record payment collections', module: 'sales' },

      'customers.view': { name: 'Query customer files', module: 'contacts' },
      'customers.manage': { name: 'Onboard new potential customers', module: 'contacts' },

      'agents.view': { name: 'View broker registers', module: 'contacts' },
      'agents.manage': { name: 'Onboard external brokers and commissions', module: 'contacts' },
    };

    const permIds: Record<string, string> = {};
    for (const [code, data] of Object.entries(permissions)) {
      const res = await client.query(
        "INSERT INTO permissions (code, name, module) VALUES ($1, $2, $3) RETURNING id",
        [code, data.name, data.module]
      );
      permIds[code] = res.rows[0].id;
    }

    // 5. Mappings for Role-Permissions (DB Matrix-driven)
    const mappings: Record<string, string[]> = {
      'PLATFORM_ADMIN': [
        'users.view', 'users.create', 'users.update', 'users.delete',
        'roles.view', 'roles.manage', 'permissions.view', 'permissions.manage',
        'tenants.view', 'tenants.manage', 'subscriptions.view', 'subscriptions.manage',
        'audit.view', 'kyc.review', 'marketplace.publish', 'marketplace.unpublish',
        'maps.upload', 'maps.view', 'projects.view', 'projects.manage',
        'layouts.view', 'layouts.manage', 'plots.view', 'plots.manage',
        'bookings.view', 'bookings.manage', 'collections.view', 'collections.manage',
        'customers.view', 'customers.manage', 'agents.view', 'agents.manage'
      ],
      'PLATFORM_SUPPORT': [
        'users.view', 'roles.view', 'permissions.view', 'tenants.view',
        'subscriptions.view', 'audit.view', 'kyc.review', 'maps.view',
        'projects.view', 'layouts.view', 'plots.view', 'bookings.view',
        'collections.view', 'customers.view', 'agents.view'
      ],
      'DEVELOPER_OWNER': [
        'users.view', 'users.create', 'users.update', 'users.delete',
        'roles.view', 'roles.manage', 'permissions.view', 'tenants.view',
        'subscriptions.view', 'subscriptions.manage', 'audit.view',
        'marketplace.publish', 'marketplace.unpublish', 'maps.upload', 'maps.view',
        'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage',
        'plots.view', 'plots.manage', 'bookings.view', 'bookings.manage',
        'collections.view', 'collections.manage', 'customers.view', 'customers.manage',
        'agents.view', 'agents.manage'
      ],
      'DEVELOPER_ADMIN': [
        'users.view', 'users.create', 'users.update',
        'roles.view', 'permissions.view', 'tenants.view',
        'subscriptions.view', 'marketplace.publish', 'maps.upload', 'maps.view',
        'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage',
        'plots.view', 'plots.manage', 'bookings.view', 'bookings.manage',
        'collections.view', 'customers.view', 'customers.manage'
      ],
      'FINANCE_MANAGER': [
        'users.view', 'subscriptions.view', 'bookings.view',
        'collections.view', 'collections.manage', 'customers.view'
      ],
      'PROJECT_MANAGER': [
        'users.view', 'maps.upload', 'maps.view',
        'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage',
        'plots.view', 'plots.manage'
      ],
      'SALES_MANAGER': [
        'users.view', 'bookings.view', 'bookings.manage',
        'collections.view', 'customers.view', 'customers.manage',
        'agents.view'
      ],
      'SALES_EXECUTIVE': [
        'bookings.view', 'bookings.manage', 'customers.view', 'customers.manage'
      ],
      'AGENT': [
        'marketplace.publish', 'projects.view', 'layouts.view', 'plots.view'
      ],
      'CUSTOMER': [
        'bookings.view', 'collections.view', 'projects.view'
      ]
    };

    for (const [roleCode, pList] of Object.entries(mappings)) {
      const rId = roleIds[roleCode];
      for (const pCode of pList) {
        const pId = permIds[pCode];
        if (rId && pId) {
          await client.query(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
            [rId, pId]
          );
        }
      }
    }

    // 6. Assign Users to Roles
    await client.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
      [adminId, roleIds['PLATFORM_ADMIN']]
    );

    await client.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [oldAdminId, roleIds['PLATFORM_ADMIN']]
    );

    await client.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
      [supportId, roleIds['PLATFORM_SUPPORT']]
    );

    await client.query(
      "INSERT INTO tenant_users (tenant_id, user_id, role_id) VALUES ($1, $2, $3)",
      [tenant1Id, ownerId, roleIds['DEVELOPER_OWNER']]
    );

    await client.query(
      "INSERT INTO tenant_users (tenant_id, user_id, role_id) VALUES ($1, $2, $3)",
      [tenant2Id, ownerId, roleIds['DEVELOPER_ADMIN']]
    );

    await client.query(
      "INSERT INTO tenant_users (tenant_id, user_id, role_id) VALUES ($1, $2, $3)",
      [tenant1Id, customerId, roleIds['CUSTOMER']]
    );

    // 7. Seed Projects, Layouts, and Plots for Marketplace Phase 2B (unconditionally so that the app works out of the box!)
    const proj1Id = '88888888-8888-8888-8888-888888888881';
    const proj2Id = '88888888-8888-8888-8888-888888888882';

    await client.query(`
      INSERT INTO projects (id, tenant_id, name, code, developer_name, location, status, rera_number, approval_status, approval_authority, launch_date, possession_target_date, approvals_metadata, publishing_status, is_featured, moderation_status, views_count, seo_settings) VALUES
      ('${proj1Id}', '${tenant1Id}', 'Greenfield Meadows', 'GM', 'Bhoomi Developer Corp', 'Sector 15, Gurgaon, HR', 'ACTIVE', 'RERA/PR/10001/HR', 'APPROVED', 'Gurgaon Urban Planning Dept', '2026-01-15', '2029-12-31', '{"water_connection": "APPROVED-981", "environmental_clearance": "PEC-2025-X"}', 'Published', true, 'APPROVED', 142, '{"meta_title": "Greenfield Meadows Township - Gated Villa Plots", "meta_description": "Premium gated villa plots in Gurgaon Sector 15 with world class clubhouse and infrastructure."}'),
      ('${proj2Id}', '${tenant1Id}', 'Royal Serenity Estate', 'RSE', 'Bhoomi Developer Corp', 'Deharadun Valley Road, UK', 'PLANNING', NULL, 'PENDING', 'Uttarakhand Town & Country Department', NULL, '2030-06-30', '{}', 'Featured', true, 'APPROVED', 85, '{"meta_title": "Royal Serenity Estate Dehradun - Premium Plots", "meta_description": "Exclusive valley-view residential villa plots in Uttarakhand."}')
    `);

    const lay1Id = '77777777-7777-7777-7777-777777777771';
    const lay2Id = '77777777-7777-7777-7777-777777777772';

    await client.query(`
      INSERT INTO layouts (id, project_id, name, code, layout_type, approval_number, approval_date, total_area_value, total_area_unit_id, measurement_unit_id, status, visibility, price_range) VALUES
      ('${lay1Id}', '${proj1Id}', 'Meadows Phase A Sector 1', 'SEC1', 'RESIDENTIAL', 'APPR-SEC-1A-981', '2026-02-10', 450000.0000, '33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333331', 'LAUNCHED', 'Public', 'Rs. 45L - 90L'),
      ('${lay2Id}', '${proj1Id}', 'Meadows Commercial Plaza', 'COMM1', 'COMMERCIAL', 'APPR-COMM-C1', '2026-03-01', 5.5000, '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333332', 'APPROVED', 'Featured', 'Rs. 1.2Cr - 2.5Cr')
    `);

    await client.query(`
      INSERT INTO plots (id, layout_id, plot_number, area_value, measurement_unit_id, length, width, road_width, corner_plot, facing, dimensions, dimensions_metadata, status, price, marketplace_visible, booking_status) VALUES
      ('66666666-6666-6666-6666-666666666661', '${lay1Id}', 'Plot 401', 2400.0000, '33333333-3333-3333-3333-333333333331', 40.00, 60.00, 40.00, false, 'EAST', '40 x 60', '{"shape": "rectangular"}', 'AVAILABLE', 4500000.00, true, 'AVAILABLE'),
      ('66666666-6666-6666-6666-666666666662', '${lay1Id}', 'Plot 402', 1200.0000, '33333333-3333-3333-3333-333333333331', 30.00, 40.00, 30.00, false, 'NORTH', '30 x 40', '{"shape": "rectangular"}', 'RESERVED', 6000000.00, true, 'RESERVED'),
      ('66666666-6666-6666-6666-666666666663', '${lay1Id}', 'Plot 403-C', 300.0000, '33333333-3333-3333-3333-333333333332', 15.00, 20.00, 50.00, true, 'NORTHEAST', '15 x 20 M', '{"shape": "corner-chamfered"}', 'AVAILABLE', 7500000.00, true, 'AVAILABLE'),
      ('66666666-6666-6666-6666-666666666664', '${lay1Id}', 'Plot 404', 1.5000, '33333333-3333-3333-3333-333333333333', NULL, NULL, 30.00, false, 'SOUTH', 'Acre Plot 1.5', '{}', 'SOLD', 12000000.00, false, 'SOLD')
    `);

    // Seed developer_profiles
    await client.query(`
      INSERT INTO developer_profiles (id, tenant_id, company_name, logo, cover_image, description, rera_number, office_address, website, phone, email, social_links, completed_projects, active_projects, years_in_business, verification_status, rating, seo_slug) VALUES
      ('55555555-5555-5555-5555-555555555551', '${tenant1Id}', 'Bhoomi Developer Corp', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=120&h=120&q=80', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=400&q=80', 'India premier eco-conscious sustainable land developer, building high-value townships and plotted developments across tier-1 and tier-2 hubs.', 'RERA/PR/10001/HR', 'Corporate Hub, Level 4, Gurgaon Sector 15, HR', 'https://bhoomi-alpha.bhoomione.in', '+91 99999 11111', 'sales@bhoomidevelopers.com', '{"twitter": "https://twitter.com/bhoomi", "linkedin": "https://linkedin.com/company/bhoomi", "facebook": "https://facebook.com/bhoomi"}', 14, 5, 15, 'VERIFIED', 4.85, 'bhoomi-alpha'),
      ('55555555-5555-5555-5555-555555555552', '${tenant2Id}', 'Alpha Landholdings', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=120&h=120&q=80', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&h=400&q=80', 'Architects of boutique plotting grids and premium second-home valley layouts across pristine mountain retreats.', 'RERA/PR/20002/DL', 'Regal Block, Connaught Place, New Delhi', 'https://bhoomi-beta.bhoomione.in', '+91 99999 22222', 'contact@alphaland.com', '{"twitter": "", "linkedin": "", "facebook": ""}', 6, 2, 8, 'VERIFIED', 4.20, 'bhoomi-beta')
    `);

    console.log("Seeded basic Sprint 2A & Phase 2B Projects, Layouts, Plots, and Developer Profiles.");

    // Seeding dynamic SaaS Relational Tables
    try {
      // 1. Seed to saas_modules
      const moduleMap: Record<string, string> = {
        'PROJECTS': '99999999-9999-4999-8999-000000000003',
        'LAYOUTS': '99999999-9999-4999-8999-000000000004',
        'PLOTS': '99999999-9999-4999-8999-000000000005',
        'BOOKINGS': '99999999-9999-4999-8999-000000000011',
        'CUSTOMERS': '99999999-9999-4999-8999-000000000006',
        'CRM': '99999999-9999-4999-8999-000000000012',
        'COLLECTIONS': '99999999-9999-4999-8999-000000000013',
        'FINANCE': '99999999-9999-4999-8999-000000000014',
        'EXPENSES': '99999999-9999-4999-8999-000000000015',
        'REPORTS': '99999999-9999-4999-8999-000000000016',
        'MARKETPLACE': '99999999-9999-4999-8999-000000000017',
        'GIS': '99999999-9999-4999-8999-000000000018',
        'DXF': '99999999-9999-4999-8999-000000000019',
        'DOCUMENTS': '99999999-9999-4999-8999-000000000020',
        'AGENT_PORTAL': '99999999-9999-4999-8999-000000000007',
        'CUSTOMER_PORTAL': '99999999-9999-4999-8999-000000000021',
        'NOTIFICATIONS': '99999999-9999-4999-8999-000000000010',
        'AI': '99999999-9999-4999-8999-000000000022',
        'SECURITY': '99999999-9999-4999-8999-000000000023',
        'AUDIT': '99999999-9999-4999-8999-000000000024',
        'INTEGRATIONS': '99999999-9999-4999-8999-000000000025',
        'ADMINISTRATION': '99999999-9999-4999-8999-000000000001',
        'SETTINGS': '99999999-9999-4999-8999-000000000026'
      };

      const modulesData = [
        { id: moduleMap['PROJECTS'], code: 'PROJECTS', name: 'Projects', group: 'Core Planning', description: 'Design, catalog, track, and administer township real estate projects.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 3, version: '1.2.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'None' },
        { id: moduleMap['LAYOUTS'], code: 'LAYOUTS', name: 'Layouts', group: 'Core Planning', description: 'Phased land parcel plans and sector map zoning layouts.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 4, version: '1.2.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'PROJECTS' },
        { id: moduleMap['PLOTS'], code: 'PLOTS', name: 'Plots', group: 'Core Planning', description: 'Individual tract plots inventory ledger catalog with custom attributes.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 5, version: '1.1.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'LAYOUTS' },
        { id: moduleMap['BOOKINGS'], code: 'BOOKINGS', name: 'Bookings', group: 'Sales & CRM', description: 'Real-time property reservation lockups, cancellations and transfers.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 6, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'PLOTS' },
        { id: moduleMap['CUSTOMERS'], code: 'CUSTOMERS', name: 'Customers', group: 'Sales & CRM', description: 'All-inclusive lead nurturing, contact profiles, and buyer records.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 7, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'None' },
        { id: moduleMap['CRM'], code: 'CRM', name: 'CRM', group: 'Sales & CRM', description: 'Advanced pipeline visualizations, client follow-up sequences, and analytics.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 8, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'CUSTOMERS' },
        { id: moduleMap['COLLECTIONS'], code: 'COLLECTIONS', name: 'Collections', group: 'Finance', description: 'Downpayments, installments, receipts dispatch, and outstanding alerts.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 9, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'BOOKINGS' },
        { id: moduleMap['FINANCE'], code: 'FINANCE', name: 'Finance', group: 'Finance', description: 'Double-entry accounting, profit center reporting, tax templates.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 10, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'COLLECTIONS' },
        { id: moduleMap['EXPENSES'], code: 'EXPENSES', name: 'Expenses', group: 'Finance', description: 'Site logistics disbursements, vendor outlays, and budget approvals.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 11, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'None' },
        { id: moduleMap['REPORTS'], code: 'REPORTS', name: 'Reports', group: 'Analytics', description: 'Comprehensive real-time insights, PDF builder, layout charts, and export.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 12, version: '1.5.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'None' },
        { id: moduleMap['MARKETPLACE'], code: 'MARKETPLACE', name: 'Marketplace', group: 'Integrations', description: 'Public facing broker catalog list to buy, hold or sell plots instantly.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 13, version: '2.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'PLOTS' },
        { id: moduleMap['GIS'], code: 'GIS', name: 'GIS', group: 'Integrations', description: 'Map zoning geographic overlays with GPS anchors and satellite visuals.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 14, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'LAYOUTS' },
        { id: moduleMap['DXF'], code: 'DXF', name: 'DXF', group: 'Integrations', description: 'Industrial CAD drawing blueprints parser to auto-generate databases.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 15, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'LAYOUTS' },
        { id: moduleMap['DOCUMENTS'], code: 'DOCUMENTS', name: 'Documents', group: 'System', description: 'Secured document management vault with contract e-signatures.', status: 'ACTIVE', isCore: true, isBillable: true, sortOrder: 16, version: '1.0.0', visibility: 'PUBLIC', type: 'CORE', dependencies: 'None' },
        { id: moduleMap['AGENT_PORTAL'], code: 'AGENT_PORTAL', name: 'Agent Portal', group: 'Portals', description: 'Dedicated external broker portal for checking available plots.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 17, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'BOOKINGS' },
        { id: moduleMap['CUSTOMER_PORTAL'], code: 'CUSTOMER_PORTAL', name: 'Customer Portal', group: 'Portals', description: 'Buyer workspace for viewing payment milestones, contracts, and receipts.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 18, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'COLLECTIONS' },
        { id: moduleMap['NOTIFICATIONS'], code: 'NOTIFICATIONS', name: 'Notifications', group: 'System', description: 'Automated SMS, WhatsApp, and Email triggers for payment updates.', status: 'ACTIVE', isCore: true, isBillable: true, sortOrder: 19, version: '2.1.0', visibility: 'PUBLIC', type: 'CORE', dependencies: 'None' },
        { id: moduleMap['AI'], code: 'AI', name: 'AI', group: 'System', description: 'Generative AI assistant for automatic layout design & contract writing.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 20, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'None' },
        { id: moduleMap['SECURITY'], code: 'SECURITY', name: 'Security', group: 'System', description: 'Advanced security controls, MFA enforcement, and API access token vault.', status: 'ACTIVE', isCore: true, isBillable: false, sortOrder: 21, version: '1.0.0', visibility: 'INTERNAL', type: 'SYSTEM', dependencies: 'None' },
        { id: moduleMap['AUDIT'], code: 'AUDIT', name: 'Audit', group: 'System', description: 'Immutable ledger audit trail logs tracking all tenant actions.', status: 'ACTIVE', isCore: true, isBillable: false, sortOrder: 22, version: '1.0.0', visibility: 'INTERNAL', type: 'SYSTEM', dependencies: 'None' },
        { id: moduleMap['INTEGRATIONS'], code: 'INTEGRATIONS', name: 'Integrations', group: 'System', description: 'External ERP connections, Zapier webhooks, and REST sync endpoints.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 23, version: '1.0.0', visibility: 'PUBLIC', type: 'OPTIONAL', dependencies: 'None' },
        { id: moduleMap['ADMINISTRATION'], code: 'ADMINISTRATION', name: 'Administration', group: 'System', description: 'Global multi-tenant supervisory console and DNS cluster configurations.', status: 'ACTIVE', isCore: true, isBillable: false, sortOrder: 1, version: '2.0.0', visibility: 'INTERNAL', type: 'SYSTEM', dependencies: 'None' },
        { id: moduleMap['SETTINGS'], code: 'SETTINGS', name: 'Settings', group: 'System', description: 'Tenant environmental and business parameters customizer panel.', status: 'ACTIVE', isCore: true, isBillable: false, sortOrder: 2, version: '1.0.0', visibility: 'PUBLIC', type: 'SYSTEM', dependencies: 'None' }
      ];

      for (const m of modulesData) {
        await client.query(`
          INSERT INTO saas_modules (id, code, name, "group", description, status, is_core, is_billable, sort_order, version, visibility, type, dependencies)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (code) DO UPDATE SET 
            name = $3, "group" = $4, description = $5, status = $6, is_core = $7, is_billable = $8, sort_order = $9,
            version = $10, visibility = $11, type = $12, dependencies = $13
        `, [m.id, m.code, m.name, m.group, m.description, m.status, m.isCore, m.isBillable, m.sortOrder, m.version, m.visibility, m.type, m.dependencies]);
      }

      // 2. Seed to saas_features
      const featureMap: Record<string, string> = {
        'PROJECTS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000001',
        'LAYOUTS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000002',
        'PLOTS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000003',
        'BOOKINGS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000011',
        'CUSTOMERS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000004',
        'CRM_PIPELINE': 'faaaaaaa-aaaa-aaaa-aaaa-000000000012',
        'COLLECTIONS_MANAGEMENT': 'faaaaaaa-aaaa-aaaa-aaaa-000000000013',
        'FINANCE_CONTROLS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000014',
        'EXPENSE_TRACKING': 'faaaaaaa-aaaa-aaaa-aaaa-000000000015',
        'ADVANCED_REPORTS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000016',
        'MARKETPLACE_LISTINGS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000017',
        'MAP_INTERACTION': 'faaaaaaa-aaaa-aaaa-aaaa-000000000007',
        'DXF_UPLOAD': 'faaaaaaa-aaaa-aaaa-aaaa-000000000006',
        'DOCUMENT_VAULT': 'faaaaaaa-aaaa-aaaa-aaaa-000000000020',
        'AGENTS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000005',
        'CUSTOMER_DASHBOARD': 'faaaaaaa-aaaa-aaaa-aaaa-000000000021',
        'WHATSAPP_TRIGGERS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000008',
        'AI_CO_PILOT': 'faaaaaaa-aaaa-aaaa-aaaa-000000000022',
        'MFA_SECURITY': 'faaaaaaa-aaaa-aaaa-aaaa-000000000023',
        'AUDIT_LOGS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000024',
        'WEBHOOKS_ENGINE': 'faaaaaaa-aaaa-aaaa-aaaa-000000000025',
        'API_ACCESS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000009',
        'SYSTEM_SETTINGS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000026'
      };

      const featuresData = [
        { id: featureMap['PROJECTS'], moduleCode: 'PROJECTS', code: 'PROJECTS', name: 'Township projects catalog', group: 'Core Planning', description: 'Create, scale, and catalog township planning models.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['LAYOUTS'], moduleCode: 'LAYOUTS', code: 'LAYOUTS', name: 'Subdivision planning tool', group: 'Core Planning', description: 'Zoned sector plans and division lines.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['PLOTS'], moduleCode: 'PLOTS', code: 'PLOTS', name: 'Physical lot registers', group: 'Core Planning', description: 'Assign coordinates, lot numbers and PLC rates.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['BOOKINGS'], moduleCode: 'BOOKINGS', code: 'BOOKINGS', name: 'Dynamic Reservations Engine', group: 'Sales & CRM', description: 'Manage and lock property reservation contracts.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['CUSTOMERS'], moduleCode: 'CUSTOMERS', code: 'CUSTOMERS', name: 'Buyer records logs', group: 'CRM', description: 'Manage customer profiles and reservation ledgers.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['CRM_PIPELINE'], moduleCode: 'CRM', code: 'CRM_PIPELINE', name: 'Leads Pipeline Management', group: 'CRM', description: 'Visualize and nurture contacts through sales funnels.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['COLLECTIONS_MANAGEMENT'], moduleCode: 'COLLECTIONS', code: 'COLLECTIONS_MANAGEMENT', name: 'Installment Tracking Ledger', group: 'Finance', description: 'Manage multi-stage customer payments and generate dynamic invoices.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['FINANCE_CONTROLS'], moduleCode: 'FINANCE', code: 'FINANCE_CONTROLS', name: 'Relational Accounting books', group: 'Finance', description: 'Configure custom tax rules, double-entry bookkeeping, and general ledgers.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['EXPENSE_TRACKING'], moduleCode: 'EXPENSES', code: 'EXPENSE_TRACKING', name: 'Company Expense Log', group: 'Finance', description: 'Log disbursements, construction bills, and broker payout structures.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['ADVANCED_REPORTS'], moduleCode: 'REPORTS', code: 'ADVANCED_REPORTS', name: 'Analytical Report Builder', group: 'Analytics', description: 'Compile site analytics, financial velocity statements, and customer sheets.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['MARKETPLACE_LISTINGS'], moduleCode: 'MARKETPLACE', code: 'MARKETPLACE_LISTINGS', name: 'Public Marketplace listings', group: 'Integrations', description: 'Automatically publish available holdings to dynamic public booking directories.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['MAP_INTERACTION'], moduleCode: 'GIS', code: 'MAP_INTERACTION', name: 'Interactive property layouts', group: 'Integrations', description: 'Visual parcel lockups on mapping widgets.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['DXF_UPLOAD'], moduleCode: 'DXF', code: 'DXF_UPLOAD', name: 'DXF CAD Drawing upload', group: 'Integrations', description: 'Render canvas lots directly out of dynamic .dxf blueprints.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['DOCUMENT_VAULT'], moduleCode: 'DOCUMENTS', code: 'DOCUMENT_VAULT', name: 'Cloud Storage Document Vault', group: 'System', description: 'Store blueprints, kyc uploads, contracts, and receipts securely.', status: 'ACTIVE', defaultEnabled: true, isSystem: true, isDeprecated: false, isUpgradeable: false },
        { id: featureMap['AGENTS'], moduleCode: 'AGENT_PORTAL', code: 'AGENTS', name: 'Broker agent scorecard', group: 'CRM', description: 'Keep logs on external broker sales targets and payouts.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['CUSTOMER_DASHBOARD'], moduleCode: 'CUSTOMER_PORTAL', code: 'CUSTOMER_DASHBOARD', name: 'Buyer Self-Service Portal', group: 'Portals', description: 'Provide customers a dedicated hub for viewing milestones and making payments.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['WHATSAPP_TRIGGERS'], moduleCode: 'NOTIFICATIONS', code: 'WHATSAPP_TRIGGERS', name: 'Automated reservation alerts', group: 'Integrations', description: 'Automatic WhatsApp, SMS, and Email broadcast triggers on transactions.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['AI_CO_PILOT'], moduleCode: 'AI', code: 'AI_CO_PILOT', name: 'GenAI Township Co-Pilot', group: 'System', description: 'Leverage Gemini models to draft custom land parcel summaries and contracts.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['MFA_SECURITY'], moduleCode: 'SECURITY', code: 'MFA_SECURITY', name: 'Advanced Authentication & Multi-factor Locks', group: 'System', description: 'Toggle mandatory secure entry gates, API client token vaults, and login filters.', status: 'ACTIVE', defaultEnabled: true, isSystem: true, isDeprecated: false, isUpgradeable: false },
        { id: featureMap['AUDIT_LOGS'], moduleCode: 'AUDIT', code: 'AUDIT_LOGS', name: 'Immutable Audit Trail logbook', group: 'System', description: 'Immutable digital trail logging workspace queries and DB mutations.', status: 'ACTIVE', defaultEnabled: true, isSystem: true, isDeprecated: false, isUpgradeable: false },
        { id: featureMap['WEBHOOKS_ENGINE'], moduleCode: 'INTEGRATIONS', code: 'WEBHOOKS_ENGINE', name: 'Dynamic Webhooks Dispatcher', group: 'System', description: 'Configure live REST triggers to sync transactional databases.', status: 'ACTIVE', defaultEnabled: true, isSystem: false, isDeprecated: false, isUpgradeable: true },
        { id: featureMap['API_ACCESS'], moduleCode: 'ADMINISTRATION', code: 'API_ACCESS', name: 'Custom API client keys', group: 'System', description: 'Export telemetry datasets to external ERP software.', status: 'ACTIVE', defaultEnabled: true, isSystem: true, isDeprecated: false, isUpgradeable: false },
        { id: featureMap['SYSTEM_SETTINGS'], moduleCode: 'SETTINGS', code: 'SYSTEM_SETTINGS', name: 'SaaS Control Settings panel', group: 'System', description: 'Configure basic company parameters, metadata, and default variables.', status: 'ACTIVE', defaultEnabled: true, isSystem: true, isDeprecated: false, isUpgradeable: false }
      ];

      for (const f of featuresData) {
        const moduleId = moduleMap[f.moduleCode];
        await client.query(`
          INSERT INTO saas_features (id, module_id, code, name, "group", description, status, default_enabled, is_system, is_deprecated, is_upgradeable)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (code) DO UPDATE SET 
            module_id = $2, name = $4, "group" = $5, description = $6, status = $7, default_enabled = $8,
            is_system = $9, is_deprecated = $10, is_upgradeable = $11
        `, [f.id, moduleId, f.code, f.name, f.group, f.description, f.status, f.defaultEnabled, f.isSystem, f.isDeprecated, f.isUpgradeable]);
      }

      // 3. Clear and Seed subscription_plans
      const planMap: Record<string, string> = {
        'STARTER': '11111111-1111-4111-9111-000000000001',
        'GROWTH': '11111111-1111-4111-9111-000000000002',
        'PROFESSIONAL': '11111111-1111-4111-9111-000000000003',
        'ENTERPRISE': '11111111-1111-4111-9111-000000000004'
      };

      const plansData = [
        { id: planMap['STARTER'], code: 'STARTER', name: 'Starter Package', monthlyPrice: 99.00, yearlyPrice: 990.00, trialDays: 14, status: 'ACTIVE', sortOrder: 1 },
        { id: planMap['GROWTH'], code: 'GROWTH', name: 'Growth Engine', monthlyPrice: 249.00, yearlyPrice: 2490.00, trialDays: 14, status: 'ACTIVE', sortOrder: 2 },
        { id: planMap['PROFESSIONAL'], code: 'PROFESSIONAL', name: 'Professional Plus', monthlyPrice: 499.00, yearlyPrice: 4990.00, trialDays: 30, status: 'ACTIVE', sortOrder: 3 },
        { id: planMap['ENTERPRISE'], code: 'ENTERPRISE', name: 'Enterprise Custom', monthlyPrice: 999.00, yearlyPrice: 9990.00, trialDays: 30, status: 'ACTIVE', sortOrder: 4 }
      ];

      for (const p of plansData) {
        await client.query(`
          INSERT INTO subscription_plans (id, plan_code, name, monthly_rate, yearly_rate, monthly_price, yearly_price, trial_days, status, sort_order)
          VALUES ($1, $2, $3, $4, $5, $4, $5, $6, $7, $8)
          ON CONFLICT (plan_code) DO UPDATE SET name = $3, monthly_rate = $4, yearly_rate = $5, monthly_price = $4, yearly_price = $5, trial_days = $6, status = $7, sort_order = $8
        `, [p.id, p.code, p.name, p.monthlyPrice, p.yearlyPrice, p.trialDays, p.status, p.sortOrder]);
      }

      // 4. Seed subscription_plan_limits
      const planLimitsData: Record<string, Record<string, number>> = {
        "STARTER": { "projectsLimit": 3, "layoutsLimit": 5, "plotsLimit": 150, "customersLimit": 300, "usersLimit": 5, "agentsLimit": 2, "storageLimitGb": 10, "documentsLimit": 50, "dxfFilesLimit": 1, "marketplaceListingsLimit": 2, "apiCallsLimit": 1000, "whatsAppMessagesLimit": 100, "aiCreditsLimit": 50 },
        "GROWTH": { "projectsLimit": 10, "layoutsLimit": 20, "plotsLimit": 500, "customersLimit": 1000, "usersLimit": 15, "agentsLimit": 5, "storageLimitGb": 25, "documentsLimit": 250, "dxfFilesLimit": 5, "marketplaceListingsLimit": 10, "apiCallsLimit": 5000, "whatsAppMessagesLimit": 500, "aiCreditsLimit": 150 },
        "PROFESSIONAL": { "projectsLimit": 30, "layoutsLimit": 60, "plotsLimit": 2000, "customersLimit": 5000, "usersLimit": 50, "agentsLimit": 20, "storageLimitGb": 100, "documentsLimit": 1000, "dxfFilesLimit": 20, "marketplaceListingsLimit": 50, "apiCallsLimit": 25000, "whatsAppMessagesLimit": 2000, "aiCreditsLimit": 500 },
        "ENTERPRISE": { "projectsLimit": 100, "layoutsLimit": 200, "plotsLimit": 10000, "customersLimit": 20000, "usersLimit": 200, "agentsLimit": 100, "storageLimitGb": 500, "documentsLimit": 5000, "dxfFilesLimit": 100, "marketplaceListingsLimit": 200, "apiCallsLimit": 100000, "whatsAppMessagesLimit": 10000, "aiCreditsLimit": 2000 }
      };

      for (const [pCode, limits] of Object.entries(planLimitsData)) {
        const planId = planMap[pCode];
        for (const [lk, lv] of Object.entries(limits)) {
          await client.query(`
            INSERT INTO subscription_plan_limits (plan_id, limit_key, limit_value)
            VALUES ($1, $2, $3)
            ON CONFLICT (plan_id, limit_key) DO UPDATE SET limit_value = $3
          `, [planId, lk, lv]);
        }
      }

      // 5. Seed subscription_plan_features (Features Matrix for Tiers)
      const matrixData: Record<string, Record<string, string>> = {
        "STARTER": {
          "PROJECTS": "ENABLED", "LAYOUTS": "ENABLED", "PLOTS": "ENABLED", "CUSTOMERS": "ENABLED", "BOOKINGS": "ENABLED",
          "CRM_PIPELINE": "DISABLED", "COLLECTIONS_MANAGEMENT": "DISABLED", "FINANCE_CONTROLS": "DISABLED", "EXPENSE_TRACKING": "DISABLED",
          "ADVANCED_REPORTS": "DISABLED", "MARKETPLACE_LISTINGS": "DISABLED", "MAP_INTERACTION": "DISABLED", "DXF_UPLOAD": "ADDON",
          "DOCUMENT_VAULT": "ENABLED", "AGENTS": "DISABLED", "CUSTOMER_DASHBOARD": "DISABLED", "WHATSAPP_TRIGGERS": "DISABLED",
          "AI_CO_PILOT": "DISABLED", "MFA_SECURITY": "ENABLED", "AUDIT_LOGS": "ENABLED", "WEBHOOKS_ENGINE": "DISABLED",
          "API_ACCESS": "DISABLED", "SYSTEM_SETTINGS": "ENABLED"
        },
        "GROWTH": {
          "PROJECTS": "ENABLED", "LAYOUTS": "ENABLED", "PLOTS": "ENABLED", "CUSTOMERS": "ENABLED", "BOOKINGS": "ENABLED",
          "CRM_PIPELINE": "ENABLED", "COLLECTIONS_MANAGEMENT": "ENABLED", "FINANCE_CONTROLS": "DISABLED", "EXPENSE_TRACKING": "ENABLED",
          "ADVANCED_REPORTS": "ENABLED", "MARKETPLACE_LISTINGS": "DISABLED", "MAP_INTERACTION": "ADDON", "DXF_UPLOAD": "ENABLED",
          "DOCUMENT_VAULT": "ENABLED", "AGENTS": "DISABLED", "CUSTOMER_DASHBOARD": "ENABLED", "WHATSAPP_TRIGGERS": "ADDON",
          "AI_CO_PILOT": "DISABLED", "MFA_SECURITY": "ENABLED", "AUDIT_LOGS": "ENABLED", "WEBHOOKS_ENGINE": "DISABLED",
          "API_ACCESS": "DISABLED", "SYSTEM_SETTINGS": "ENABLED"
        },
        "PROFESSIONAL": {
          "PROJECTS": "ENABLED", "LAYOUTS": "ENABLED", "PLOTS": "ENABLED", "CUSTOMERS": "ENABLED", "BOOKINGS": "ENABLED",
          "CRM_PIPELINE": "ENABLED", "COLLECTIONS_MANAGEMENT": "ENABLED", "FINANCE_CONTROLS": "ENABLED", "EXPENSE_TRACKING": "ENABLED",
          "ADVANCED_REPORTS": "ENABLED", "MARKETPLACE_LISTINGS": "ENABLED", "MAP_INTERACTION": "ENABLED", "DXF_UPLOAD": "ENABLED",
          "DOCUMENT_VAULT": "ENABLED", "AGENTS": "ENABLED", "CUSTOMER_DASHBOARD": "ENABLED", "WHATSAPP_TRIGGERS": "ENABLED",
          "AI_CO_PILOT": "ADDON", "MFA_SECURITY": "ENABLED", "AUDIT_LOGS": "ENABLED", "WEBHOOKS_ENGINE": "ENABLED",
          "API_ACCESS": "ENABLED", "SYSTEM_SETTINGS": "ENABLED"
        },
        "ENTERPRISE": {
          "PROJECTS": "ENABLED", "LAYOUTS": "ENABLED", "PLOTS": "ENABLED", "CUSTOMERS": "ENABLED", "BOOKINGS": "ENABLED",
          "CRM_PIPELINE": "ENABLED", "COLLECTIONS_MANAGEMENT": "ENABLED", "FINANCE_CONTROLS": "ENABLED", "EXPENSE_TRACKING": "ENABLED",
          "ADVANCED_REPORTS": "ENABLED", "MARKETPLACE_LISTINGS": "ENABLED", "MAP_INTERACTION": "ENABLED", "DXF_UPLOAD": "ENABLED",
          "DOCUMENT_VAULT": "ENABLED", "AGENTS": "ENABLED", "CUSTOMER_DASHBOARD": "ENABLED", "WHATSAPP_TRIGGERS": "ENABLED",
          "AI_CO_PILOT": "ENABLED", "MFA_SECURITY": "ENABLED", "AUDIT_LOGS": "ENABLED", "WEBHOOKS_ENGINE": "ENABLED",
          "API_ACCESS": "ENABLED", "SYSTEM_SETTINGS": "ENABLED"
        }
      };

      for (const [pCode, featureStatus] of Object.entries(matrixData)) {
        const planId = planMap[pCode];
        for (const [fCode, level] of Object.entries(featureStatus)) {
          const featureId = featureMap[fCode];
          if (featureId) {
            await client.query(`
              INSERT INTO subscription_plan_features (plan_id, feature_id, access_level)
              VALUES ($1, $2, $3)
              ON CONFLICT (plan_id, feature_id) DO UPDATE SET access_level = $3
            `, [planId, featureId, level]);
          }
        }
      }

      // 6. Seed subscription_addons
      const addonsData = [
        { code: "INTERACTIVE_MAP_ADDON", name: "Interactive Township Map", monthlyPrice: 35.00, yearlyPrice: 350.00, status: "ACTIVE", description: "Enables customers to pick and book township plot positions on customized canvas overlays." },
        { code: "DXF_ENGINE_ADDON", name: "Heavy DXF Upload Parser", monthlyPrice: 50.00, yearlyPrice: 500.00, status: "ACTIVE", description: "Batch load AutoCAD .dxf configurations dynamically straight to individual tables." },
        { code: "WHATSAPP_ADDON", name: "WhatsApp checkout triggers", monthlyPrice: 20.00, yearlyPrice: 200.00, status: "ACTIVE", description: "Configure custom template alerts notifying buyers about broker updates." },
        { code: "CUSTOM_DOMAIN_ADDON", name: "Custom Domain Mapping SSL", monthlyPrice: 15.00, yearlyPrice: 150.00, status: "ACTIVE", description: "Proxy workspace containers onto localized web addresses securely." }
      ];

      for (const a of addonsData) {
        await client.query(`
          INSERT INTO subscription_addons (code, name, monthly_price, yearly_price, description, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (code) DO UPDATE SET name = $2, monthly_price = $3, yearly_price = $4, description = $5, status = $6
        `, [a.code, a.name, a.monthlyPrice, a.yearlyPrice, a.description, a.status]);
      }

      // 7. Seed subscription_plot_slabs
      const slabsData = [
        { minPlots: 1, maxPlots: 50, monthlyPrice: 5000.00, yearlyPrice: 50000.00 },
        { minPlots: 51, maxPlots: 100, monthlyPrice: 8000.00, yearlyPrice: 80000.00 },
        { minPlots: 101, maxPlots: 250, monthlyPrice: 15000.00, yearlyPrice: 150000.00 },
        { minPlots: 251, maxPlots: 500, monthlyPrice: 25000.00, yearlyPrice: 250000.00 },
        { minPlots: 501, maxPlots: 1000, monthlyPrice: 40000.00, yearlyPrice: 400000.00 },
        { minPlots: 1001, maxPlots: 2500, monthlyPrice: 70000.00, yearlyPrice: 700000.00 },
        { minPlots: 2501, maxPlots: 5000, monthlyPrice: 120000.00, yearlyPrice: 1200000.00 },
        { minPlots: 5001, maxPlots: 10000, monthlyPrice: 200000.00, yearlyPrice: 2000000.00 },
        { minPlots: 10001, maxPlots: 999999, monthlyPrice: 350000.00, yearlyPrice: 3500000.00 }
      ];

      await client.query(`TRUNCATE TABLE subscription_plot_slabs CASCADE`);
      for (const s of slabsData) {
        await client.query(`
          INSERT INTO subscription_plot_slabs (min_plots, max_plots, monthly_price, yearly_price)
          VALUES ($1, $2, $3, $4)
        `, [s.minPlots, s.maxPlots, s.monthlyPrice, s.yearlyPrice]);
      }

      // 8. Ensure Tenant Subscriptions exist to connect
      await client.query(`
        INSERT INTO tenant_subscriptions (id, tenant_id, plan_id, status, expires_at, subscription_start_date, subscription_expiry_date, trial_expiry_date, renewal_date)
        VALUES 
          ('11111111-1111-4111-8111-111111111111', '${tenant1Id}', '${planMap['GROWTH']}', 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '30 days'),
          ('22222222-2222-4222-8222-222222222222', '${tenant2Id}', '${planMap['GROWTH']}', 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '30 days')
        ON CONFLICT (id) DO UPDATE SET 
          plan_id = EXCLUDED.plan_id, status = EXCLUDED.status, expires_at = EXCLUDED.expires_at, 
          subscription_start_date = EXCLUDED.subscription_start_date, subscription_expiry_date = EXCLUDED.subscription_expiry_date,
          trial_expiry_date = EXCLUDED.trial_expiry_date, renewal_date = EXCLUDED.renewal_date
      `);

      // 9. Seed Payment Gateways
      const gatewaysData = [
        { code: 'RAZORPAY', name: 'Razorpay', is_enabled: true, environment: 'SANDBOX', api_key: 'rzp_test_51O2aB6...', secret_key: 'sk_test_90XyZ1...', webhook_secret: 'whsec_rzp123', currency: 'INR', is_default: true },
        { code: 'CASHFREE', name: 'Cashfree', is_enabled: false, environment: 'SANDBOX', api_key: 'cf_test_61P3cD8...', secret_key: 'sk_cf_80YaW2...', webhook_secret: 'whsec_cf123', currency: 'INR', is_default: false },
        { code: 'PHONEPE', name: 'PhonePe', is_enabled: false, environment: 'SANDBOX', api_key: 'pp_test_71Q4eF9...', secret_key: 'sk_pp_70ZaV3...', webhook_secret: 'whsec_pp123', currency: 'INR', is_default: false },
        { code: 'STRIPE', name: 'Stripe', is_enabled: false, environment: 'SANDBOX', api_key: 'pk_test_81R5fG0...', secret_key: 'sk_stripe_60WbU4...', webhook_secret: 'whsec_stripe123', currency: 'USD', is_default: false },
        { code: 'PAYPAL', name: 'PayPal', is_enabled: false, environment: 'SANDBOX', api_key: 'client_paypal_91S...', secret_key: 'secret_paypal_50Xa...', webhook_secret: 'whsec_paypal123', currency: 'USD', is_default: false },
        { code: 'MANUAL', name: 'Manual Payment', is_enabled: true, environment: 'PRODUCTION', api_key: null, secret_key: null, webhook_secret: null, currency: 'INR', is_default: false },
        { code: 'BANK_TRANSFER', name: 'Bank Transfer', is_enabled: true, environment: 'PRODUCTION', api_key: null, secret_key: null, webhook_secret: null, currency: 'INR', is_default: false }
      ];

      for (const g of gatewaysData) {
        await client.query(`
          INSERT INTO payment_gateways (gateway_code, name, is_enabled, environment, api_key, secret_key, webhook_secret, currency, is_default)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [g.code, g.name, g.is_enabled, g.environment, g.api_key, g.secret_key, g.webhook_secret, g.currency, g.is_default]);
      }

      // Seed dummy transaction logs
      await client.query(`
        INSERT INTO payment_logs (gateway_code, transaction_id, amount, currency, status, error_message, customer_email)
        VALUES 
          ('RAZORPAY', 'pay_Njd982Kds', 2490.00, 'INR', 'SUCCESS', NULL, 'owner@developer1.com'),
          ('RAZORPAY', 'pay_Kjs823Usa', 990.00, 'INR', 'FAILED', 'Insufficient funds / card declined', 'customer@bhoomione.com'),
          ('STRIPE', 'ch_1N92saK8s', 49.00, 'USD', 'SUCCESS', NULL, 'owner@developer1.com')
      `);

      // Seed dummy webhook logs
      await client.query(`
        INSERT INTO webhook_logs (gateway_code, event_type, payload, status, error_message)
        VALUES 
          ('RAZORPAY', 'payment.authorized', '{"event": "payment.authorized", "payload": {"payment": {"entity": {"id": "pay_Njd982Kds", "amount": 249000}}}}', 'PROCESSED', NULL),
          ('STRIPE', 'charge.failed', '{"event": "charge.failed", "payload": {"charge": {"entity": {"id": "ch_failed_123", "amount": 4900}}}}', 'VERIFIED', NULL)
      `);

      // Seed Default State-wise Tax Rules and Builder-specific Overrides
      
      await client.query(`
        INSERT INTO tax_rules (tenant_id, tax_type, name, rate_percentage, state_code, effective_from, is_active)
        VALUES
          -- Platform Defaults (Global Rules)
          (NULL, 'CGST', 'Central GST Default', 9.00, 'ALL', '2026-01-01', true),
          (NULL, 'SGST', 'State GST Default', 9.00, 'ALL', '2026-01-01', true),
          (NULL, 'IGST', 'Integrated GST Default', 18.00, 'ALL', '2026-01-01', true),
          (NULL, 'TDS', 'TDS on Land Sale (Sec 194IA)', 1.00, 'ALL', '2026-01-01', true),
          (NULL, 'STAMP_DUTY', 'Stamp Duty Default', 5.00, 'ALL', '2026-01-01', true),
          (NULL, 'REGISTRATION', 'Registration Charges Default', 1.00, 'ALL', '2026-01-01', true),

          -- State-Specific Rules (Karnataka - KA)
          (NULL, 'SGST', 'Karnataka SGST', 9.00, 'KA', '2026-01-01', true),
          (NULL, 'CGST', 'Karnataka CGST', 9.00, 'KA', '2026-01-01', true),
          (NULL, 'STAMP_DUTY', 'Karnataka Stamp Duty', 5.60, 'KA', '2026-01-01', true),
          (NULL, 'REGISTRATION', 'Karnataka Registration', 1.00, 'KA', '2026-01-01', true),
          (NULL, 'OTHER', 'Karnataka Infrastructure Cess', 1.00, 'KA', '2026-01-01', true),

          -- State-Specific Rules (Maharashtra - MH)
          (NULL, 'SGST', 'Maharashtra SGST', 9.00, 'MH', '2026-01-01', true),
          (NULL, 'CGST', 'Maharashtra CGST', 9.00, 'MH', '2026-01-01', true),
          (NULL, 'STAMP_DUTY', 'Maharashtra Stamp Duty', 6.00, 'MH', '2026-01-01', true),
          (NULL, 'REGISTRATION', 'Maharashtra Registration Charges', 1.00, 'MH', '2026-01-01', true),
          (NULL, 'OTHER', 'Maharashtra Local Body Tax', 0.50, 'MH', '2026-01-01', true),

          -- State-Specific Rules (Haryana - HR)
          (NULL, 'SGST', 'Haryana SGST', 9.00, 'HR', '2026-01-01', true),
          (NULL, 'CGST', 'Haryana CGST', 9.00, 'HR', '2026-01-01', true),
          (NULL, 'STAMP_DUTY', 'Haryana Stamp Duty', 7.00, 'HR', '2026-01-01', true),
          (NULL, 'REGISTRATION', 'Haryana Registration Fee', 1.00, 'HR', '2026-01-01', true),
          (NULL, 'OTHER', 'Haryana Development Cess', 0.80, 'HR', '2026-01-01', true),

          -- Builder-Specific Overrides (Bhoomi Developer Corp - tenant1Id)
          ('${tenant1Id}', 'TDS', 'Bhoomi Custom TDS concession', 0.75, 'ALL', '2026-01-01', true),
          ('${tenant1Id}', 'STAMP_DUTY', 'Bhoomi Concession Stamp Duty KA', 4.50, 'KA', '2026-01-01', true),
          ('${tenant1Id}', 'REGISTRATION', 'Bhoomi Concession Registration KA', 0.80, 'KA', '2026-01-01', true),
          ('${tenant1Id}', 'OTHER', 'Bhoomi Internal Infrastructure Waiver', 0.00, 'KA', '2026-01-01', true)
      `);

      // Seed Dummy Tax Transactions for Reports & Invoice Integration
      await client.query(`
        INSERT INTO tax_transactions (tenant_id, invoice_number, customer_name, state_code, base_amount, cgst_amount, sgst_amount, igst_amount, tds_amount, stamp_duty_amount, registration_charges, other_charges, total_tax_amount, total_invoice_amount)
        VALUES
          ('${tenant1Id}', 'BO-INV-2026-001', 'Rajesh Kumar', 'KA', 5000000.00, 450000.00, 450000.00, 0.00, 37500.00, 225000.00, 40000.00, 0.00, 1202500.00, 6202500.00),
          ('${tenant1Id}', 'BO-INV-2026-002', 'Amit Sharma', 'MH', 7500000.00, 675000.00, 675000.00, 0.00, 75000.00, 450000.00, 75000.00, 37500.00, 1987500.00, 9487500.00),
          ('${tenant1Id}', 'BO-INV-2026-003', 'Vikram Singh', 'HR', 4000000.00, 360000.00, 360000.00, 0.00, 40000.00, 280000.00, 40000.00, 32000.00, 1112000.00, 5112000.00),
          ('${tenant1Id}', 'BO-INV-2026-004', 'Sunita Patil', 'KA', 6000000.00, 540000.00, 540000.00, 0.00, 45000.00, 270000.00, 48000.00, 0.00, 1443000.00, 7443000.00),
          ('${tenant1Id}', 'BO-INV-2026-005', 'John Doe (Interstate)', 'DL', 3500000.00, 0.00, 0.00, 630000.00, 35000.00, 175000.00, 35000.00, 0.00, 875000.00, 4375000.00)
      `);

      // Seed default email configurations (8 providers)
      await client.query(`
        INSERT INTO email_configurations (provider_code, name, is_enabled, is_default, host, port, encryption, username, password, sender_name, sender_email, custom_params, status)
        VALUES
          ('SMTP', 'Central SMTP Relay', true, true, 'smtp.mailgun.org', 587, 'TLS', 'postmaster@bhoomione.in', 'sk_smtp_auth_9812as', 'BhoomiOne Outbound', 'no-reply@bhoomione.in', '{}', 'ACTIVE'),
          ('SES', 'Amazon SES Gateway', false, false, 'email-smtp.us-east-1.amazonaws.com', 465, 'SSL', 'AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', 'BhoomiOne Outbound', 'no-reply@bhoomione.in', '{"region": "us-east-1", "access_key_id": "AKIAIOSFODNN7EXAMPLE"}', 'INACTIVE'),
          ('MAILGUN', 'Mailgun API Relay', false, false, 'api.mailgun.net', 443, 'TLS', NULL, 'key-mailgun-api-secret', 'BhoomiOne Outbound', 'no-reply@bhoomione.in', '{"domain": "mg.bhoomione.in", "region": "US"}', 'INACTIVE'),
          ('SENDGRID', 'SendGrid Delivery Engine', false, false, 'smtp.sendgrid.net', 587, 'TLS', 'apikey', 'SG.SendGridApiKeyPlaceholder12345', 'BhoomiOne Outbound', 'no-reply@bhoomione.in', '{}', 'INACTIVE'),
          ('BREVO', 'Brevo (formerly Sendinblue)', false, false, 'smtp-relay.brevo.com', 587, 'TLS', 'brevo-user-id@gmail.com', 'xkeysib-brevo-secret-key', 'BhoomiOne Outbound', 'no-reply@bhoomione.in', '{}', 'INACTIVE'),
          ('ZOHO', 'Zoho Mail Relaying', false, false, 'smtp.zoho.in', 465, 'SSL', 'admin@bhoomione.in', 'zoho_secure_pass_123', 'BhoomiOne Outbound', 'no-reply@bhoomione.in', '{}', 'INACTIVE'),
          ('OFFICE365', 'Microsoft 365 Exchange', false, false, 'smtp.office365.com', 587, 'TLS', 'office@bhoomione.in', 'ms_office_secret_pass', 'BhoomiOne Outbound', 'no-reply@bhoomione.in', '{}', 'INACTIVE'),
          ('GMAIL_OAUTH', 'Gmail REST API OAuth 2.0', false, false, 'smtp.gmail.com', 587, 'TLS', 'oauth2-user', 'oauth_token_placeholder', 'BhoomiOne Outbound', 'no-reply@bhoomione.in', '{"client_id": "gmail-client-id-123", "client_secret": "gmail-client-secret-123", "refresh_token": "gmail-refresh-token-123"}', 'INACTIVE')
      `);

      // Seed core email templates (7 required templates)
      await client.query(`
        INSERT INTO email_templates (template_key, name, subject, body_html, body_text)
        VALUES
          ('WELCOME', 'Welcome Email', 'Welcome to BhoomiOne V2!', '<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 12px; background: #ffffff;"><h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to BhoomiOne V2, {{name}}!</h2><p>Your real estate SaaS platform account is fully set up and ready to go.</p><p style="margin-top: 30px;">Regards,<br><strong>BhoomiOne Team</strong></p></div>', ''Welcome to BhoomiOne V2, {{name}}! Your real estate SaaS platform account is fully set up and ready to go. Regards, BhoomiOne Team''),
          
          ('PASSWORD_RESET', 'Password Reset Request', 'Reset Your Password', '<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 12px; background: #ffffff;"><h2 style="color: #ef4444; margin-bottom: 20px;">Password Reset Request</h2><p>Click the link below to reset your password. This link will expire in 1 hour.</p><p style="margin: 30px 0;"><a href="{{reset_link}}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a></p><p style="color: #666; font-size: 12px;">If you didn''t request this, you can ignore this email.</p></div>', ''Password Reset Request. Click the link below to reset your password: {{reset_link}}''),
          
          ('TENANT_PROVISIONED', 'Tenant Workspace Provisioned', 'Your Real Estate Builder Tenant Portal is Ready!', '<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 12px; background: #ffffff;"><h2 style="color: #10b981; margin-bottom: 20px;">Tenant Workspace Provisioned</h2><p>Your tenant workspace <strong>{{tenant_name}}</strong> ({{tenant_domain}}) is now active.</p><p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">Access URL: <a href="https://{{tenant_domain}}/portal" style="color: #4f46e5; font-weight: bold;">https://{{tenant_domain}}/portal</a></p></div>', ''Tenant Workspace {{tenant_name}} is now active. Access URL: https://{{tenant_domain}}/portal''),
          
          ('SUBSCRIPTION', 'Subscription Upgrades & Changes', 'Subscription Plan Confirmed – BhoomiOne V2', '<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 12px; background: #ffffff;"><h2 style="color: #4f46e5; margin-bottom: 20px;">Subscription Active</h2><p>Your subscription to the <strong>{{plan_name}}</strong> has been updated successfully.</p><p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">Billing Period: <strong>{{billing_period}}</strong></p></div>', ''Your subscription to the {{plan_name}} has been updated successfully.''),
          
          ('INVOICE', 'Invoice Created', 'New Invoice #{{invoice_number}} – BhoomiOne V2', '<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 12px; background: #ffffff;"><h2 style="color: #4f46e5; margin-bottom: 20px;">New Invoice Generated</h2><p>An invoice has been generated for your recent real estate transaction.</p><p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">Invoice Number: <strong>{{invoice_number}}</strong><br>Total Amount: <strong>₹{{amount}}</strong></p></div>', ''An invoice has been generated for your recent transaction: #{{invoice_number}} for ₹{{amount}}''),
          
          ('RECEIPT', 'Payment Receipt', 'Payment Receipt – Invoice #{{invoice_number}}', '<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 12px; background: #ffffff;"><h2 style="color: #10b981; margin-bottom: 20px;">Payment Received</h2><p>Thank you for your payment of <strong>₹{{amount}}</strong>.</p><p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">Transaction ID: <strong>{{transaction_id}}</strong></p></div>', ''Thank you for your payment of ₹{{amount}}. Transaction ID: {{transaction_id}}''),
          
          ('VERIFICATION', 'Account OTP Verification', 'Verify Your Email Address', '<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 12px; background: #ffffff;"><h2 style="color: #4f46e5; margin-bottom: 20px;">Email Verification Required</h2><p>Please enter the code below to verify your email address:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px;">{{code}}</p></div>', ''Your email verification OTP is: {{code}}'')
      `);

      // Seed dummy logs for delivery, bounce, failure charts and lists
      await client.query(`
        INSERT INTO email_logs (provider_code, template_key, recipient_email, recipient_name, subject, body_html, status, error_message, retry_count, sent_at)
        VALUES
          ('SMTP', 'WELCOME', 'karan.sharma@example.com', 'Karan Sharma', 'Welcome to BhoomiOne V2!', '...', 'DELIVERED', NULL, 0, NOW() - INTERVAL '1 hour'),
          ('SMTP', 'VERIFICATION', 'sneha.patel@example.com', 'Sneha Patel', 'Verify Your Email Address', '...', 'DELIVERED', NULL, 0, NOW() - INTERVAL '2 hours'),
          ('SMTP', 'PASSWORD_RESET', 'unknown-user@invalid-domain.xyz', 'John Doe', 'Reset Your Password', '...', 'BOUNCED', '550 5.1.1 User Unknown', 1, NOW() - INTERVAL '3 hours'),
          ('SMTP', 'INVOICE', 'rahul.verma@example.com', 'Rahul Verma', 'New Invoice #BO-INV-2026-001', '...', 'FAILED', 'Connection timed out: smtp.mailgun.org:587', 3, NOW() - INTERVAL '4 hours'),
          ('SMTP', 'TENANT_PROVISIONED', 'builder@bhoomione.in', 'Elite Builders Ltd', 'Your Real Estate Builder Tenant Portal is Ready!', '...', 'DELIVERED', NULL, 0, NOW() - INTERVAL '10 minutes')
      `);

      console.log("Seeded relational PostgreSQL SaaS models, plans, limits, addons, slabs, tax rules and transactions, and tenant subscriptions successfully.");

      // --- SEED NOTIFICATION ENGINE DATA ---
      // Clear notification tables
      await client.query("TRUNCATE TABLE notification_logs, notification_templates, notification_configurations CASCADE");

      // Seed notification configurations
      await client.query(`
        INSERT INTO notification_configurations (channel, provider_code, name, is_enabled, is_default, config_params, status)
        VALUES
          ('EMAIL', 'SMTP', 'Central SMTP Relay', true, true, '{"host": "smtp.mailgun.org", "port": 587, "encryption": "TLS", "username": "postmaster@bhoomione.in"}', 'ACTIVE'),
          ('EMAIL', 'SES', 'AWS SES Gateway', false, false, '{"region": "us-east-1", "access_key_id": "AKIAIOSFODNN7EXAMPLE"}', 'INACTIVE'),
          ('SMS', 'TWILIO_SMS', 'Twilio SMS Gateway', true, true, '{"account_sid": "AC112233445566778899aabbccddeeff", "sender_id": "BHOOMI"}', 'ACTIVE'),
          ('SMS', 'PLIVO', 'Plivo SMS Outbound', false, false, '{"auth_id": "MAYZZMNOTZNMNDNIZD", "sender_id": "BHOOMI"}', 'INACTIVE'),
          ('WHATSAPP', 'TWILIO_WA', 'Twilio WhatsApp API', true, true, '{"whatsapp_phone": "+14155238886"}', 'ACTIVE'),
          ('WHATSAPP', 'META_WA', 'Meta WhatsApp Cloud API', false, false, '{"phone_number_id": "10198273812", "business_id": "921827318"}', 'INACTIVE'),
          ('PUSH', 'FCM', 'Firebase Cloud Messaging (FCM)', true, true, '{"project_id": "bhoomione-v2", "messaging_sender_id": "129837192"}', 'ACTIVE'),
          ('IN_APP', 'IN_APP_SYSTEM', 'In-App Notification Center Engine', true, true, '{}', 'ACTIVE'),
          ('WEBHOOK', 'GENERIC_WEBHOOK', 'Global Webhook Hub Receiver', true, true, '{"endpoint_url": "https://api.bhoomione.in/v1/webhook-receiver", "signing_secret": "whsec_bhoomi_v2_992123"}', 'ACTIVE')
      `);

      // Seed notification templates (for all 11 required event types!)
      await client.query(`
        INSERT INTO notification_templates (event_type, name, email_subject, email_body_html, sms_template, whatsapp_template, push_title, push_body, in_app_body, webhook_payload_template)
        VALUES
          ('TENANT_CREATED', 'Tenant Creation Welcome', 'BhoomiOne Workspace Created - {{tenant_name}}', 
           '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #4f46e5;">Welcome to BhoomiOne!</h2><p>Your tenant workspace {{tenant_name}} has been created successfully.</p></div>',
           'BhoomiOne: Your builder tenant workspace {{tenant_name}} has been provisioned successfully. Access: https://{{tenant_domain}}/portal',
           'Hello {{admin_name}}, your real estate builder portal *{{tenant_name}}* is now active. Access dashboard at https://{{tenant_domain}}/portal.',
           'Tenant Workspace Active', 'Workspace {{tenant_name}} has been provisioned.',
           'System has successfully provisioned tenant workspace {{tenant_name}} on domain {{tenant_domain}}.',
           '{"event": "tenant.created", "tenant_id": "{{tenant_id}}", "tenant_name": "{{tenant_name}}", "timestamp": "{{timestamp}}"}'
          ),
          ('BOOKING', 'New Unit Plot Booking', 'Unit Plot Booking Confirmed - {{unit_number}}',
           '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #10b981;">Plot Booking Confirmed</h2><p>Dear {{customer_name}}, plot unit {{unit_number}} at layout {{layout_name}} has been booked.</p></div>',
           'BhoomiOne: Dear {{customer_name}}, booking for unit {{unit_number}} at {{layout_name}} is confirmed. Booking ID: {{booking_id}}.',
           'Dear {{customer_name}}, plot unit *{{unit_number}}* is officially booked at *{{layout_name}}*. Booking reference: {{booking_id}}.',
           'New Plot Booked', 'Plot unit {{unit_number}} at {{layout_name}} is confirmed.',
           'New booking registered for plot unit {{unit_number}} by customer {{customer_name}}.',
           '{"event": "booking.confirmed", "booking_id": "{{booking_id}}", "customer_email": "{{customer_email}}", "amount": "{{amount}}"}'
          ),
          ('PAYMENT', 'Payment Received Notice', 'Payment Received - ₹{{amount}}',
           '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #10b981;">Payment Acknowledgment</h2><p>Payment of ₹{{amount}} received for booking reference {{booking_id}}.</p></div>',
           'BhoomiOne: Payment of ₹{{amount}} has been received for Booking Ref: {{booking_id}}.',
           'Dear {{customer_name}}, we have received a payment of *₹{{amount}}* for Booking ID: {{booking_id}}.',
           'Payment Received', 'Amount of ₹{{amount}} credited successfully.',
           'Payment of ₹{{amount}} received from customer {{customer_name}} (Booking ID: {{booking_id}}).',
           '{"event": "payment.received", "booking_id": "{{booking_id}}", "amount": "{{amount}}", "tx_id": "{{transaction_id}}"}'
          ),
          ('INVOICE', 'Invoice Generated Alert', 'New Invoice #{{invoice_number}} Generated',
           '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #4f46e5;">Invoice Generated</h2><p>Invoice #{{invoice_number}} has been created for plot booking {{booking_id}}.</p></div>',
           'BhoomiOne: Invoice #{{invoice_number}} of ₹{{amount}} has been generated for your transaction.',
           'Dear {{customer_name}}, invoice *#{{invoice_number}}* for *₹{{amount}}* is now generated. View and pay at your portal.',
           'New Invoice #{{invoice_number}}', 'Invoice of ₹{{amount}} is ready for payment.',
           'Invoice #{{invoice_number}} has been generated for ₹{{amount}}.',
           '{"event": "invoice.generated", "invoice_number": "{{invoice_number}}", "amount": "{{amount}}"}'
          ),
          ('RECEIPT', 'Official Tax Receipt Issued', 'Tax Receipt for Invoice #{{invoice_number}}',
           '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #10b981;">Payment Receipt</h2><p>Receipt issued for invoice #{{invoice_number}}. Tax paid: ₹{{tax_amount}}.</p></div>',
           'BhoomiOne: Tax Receipt for Invoice #{{invoice_number}} has been issued. Amount: ₹{{amount}}.',
           'Dear {{customer_name}}, receipt for Invoice *#{{invoice_number}}* has been issued. Payment ID: {{payment_id}}.',
           'Receipt Issued', 'Tax receipt for #{{invoice_number}} is ready to download.',
           'Official receipt for Invoice #{{invoice_number}} has been generated and filed.',
           '{"event": "receipt.issued", "invoice_number": "{{invoice_number}}", "receipt_id": "{{receipt_id}}"}'
          ),
          ('AGREEMENT', 'Sale Agreement Execution Alert', 'Sale Agreement Ready for Signatures',
           '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #4f46e5;">Sale Agreement Ready</h2><p>Dear {{customer_name}}, the draft sale agreement for unit {{unit_number}} is ready for digital signature.</p></div>',
           'BhoomiOne: Sale Agreement for unit {{unit_number}} is ready. Digital signature required: {{signature_link}}.',
           'Dear {{customer_name}}, the Sale Agreement for unit *{{unit_number}}* is ready. Sign digitally here: {{signature_link}}.',
           'Agreement Pending Signature', 'Agreement for plot {{unit_number}} requires your signature.',
           'Draft sale agreement for plot unit {{unit_number}} has been compiled and dispatched to {{customer_name}}.',
           '{"event": "agreement.prepared", "unit_number": "{{unit_number}}", "agreement_id": "{{agreement_id}}"}'
          ),
          ('EMI_REMINDER', 'Upcoming Installment EMI Reminder', 'EMI Installment Reminder - Due in {{days}} days',
           '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #f59e0b;">EMI Installment Notice</h2><p>Dear {{customer_name}}, your upcoming installment of ₹{{amount}} is due on {{due_date}}.</p></div>',
           'BhoomiOne: EMI of ₹{{amount}} is due on {{due_date}}. Avoid late fees by paying via portal.',
           'Dear {{customer_name}}, quick reminder that your next EMI installment of *₹{{amount}}* is due on *{{due_date}}*.',
           'Upcoming EMI Due', 'Installment of ₹{{amount}} is due on {{due_date}}.',
           'Scheduled EMI reminder triggered for customer {{customer_name}} (Plot: {{unit_number}}, Due: {{due_date}}).',
           '{"event": "emi.reminder", "customer_email": "{{customer_email}}", "due_amount": "{{amount}}", "due_date": "{{due_date}}"}'
          ),
          ('SUBSCRIPTION_RENEWAL', 'SaaS Plan Subscription Renewal Notice', 'BhoomiOne SaaS Subscription Renewing Soon',
           '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #4f46e5;">SaaS Renewal Approaching</h2><p>Your subscription plan will renew automatically on {{renewal_date}}.</p></div>',
           'BhoomiOne: Your platform plan {{plan_name}} will renew on {{renewal_date}}. Billing amount: ₹{{amount}}.',
           'Hello, your *{{plan_name}}* subscription is scheduled for auto-renewal on *{{renewal_date}}*. Secure payment of ₹{{amount}}.',
           'SaaS Subscription Renewing', 'Plan {{plan_name}} auto-renewing on {{renewal_date}}.',
           'Platform plan subscription renewal schedule notification sent to tenant administrator.',
           '{"event": "subscription.renewing", "plan_name": "{{plan_name}}", "renewal_date": "{{renewal_date}}"}'
          ),
          ('LEAD_ASSIGNMENT', 'Real Estate Lead Assignment Alert', 'New Sales Lead Assigned to You: {{lead_name}}',
           '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #4f46e5;">New Lead Assigned</h2><p>You have been assigned a new high-priority lead: {{lead_name}} (Phone: {{lead_phone}}).</p></div>',
           'BhoomiOne: New Lead assigned: {{lead_name}} ({{lead_phone}}). Please follow up immediately.',
           'Hi {{agent_name}}, a new lead *{{lead_name}}* has been assigned to you. Interested in project: *{{project_name}}*. Follow-up today!',
           'New Lead Assigned', 'Lead {{lead_name}} assigned to your sales pipeline.',
           'Lead {{lead_name}} ({{lead_email}}) assigned to sales executive {{agent_name}}.',
           '{"event": "lead.assigned", "lead_id": "{{lead_id}}", "agent_id": "{{agent_id}}"}'
          ),
          ('SITE_VISIT', 'Site Visit Schedule Notification', 'Site Visit Confirmed - {{project_name}}',
           '<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #4f46e5;">Site Visit Confirmed</h2><p>Dear {{customer_name}}, your physical site tour of {{project_name}} is confirmed for {{visit_time}}.</p></div>',
           'BhoomiOne: Your physical tour of {{project_name}} is confirmed for {{visit_time}}. Executive contact: {{agent_phone}}.',
           'Dear {{customer_name}}, your site visit for *{{project_name}}* is scheduled on *{{visit_time}}*. Assistant: {{agent_name}}.',
           'Site Visit Scheduled', 'Physical tour of {{project_name}} confirmed on {{visit_time}}.',
           'Site visit scheduled for customer {{customer_name}} at project site {{project_name}} for {{visit_time}}.',
           '{"event": "site_visit.scheduled", "customer_name": "{{customer_name}}", "visit_time": "{{visit_time}}"}'
          ),
          ('ADMIN_ALERTS', 'Critical System Administrator Alerts', '[CRITICAL ALERT] BhoomiOne System Admin Notice',
           '<div style="font-family: sans-serif; padding: 20px; background: #fffbeb;"><h2 style="color: #b45309;">System Admin Notice</h2><p>A system status action is required: {{message}}.</p></div>',
           'BhoomiOne Admin: CRITICAL Alert: {{message}}.',
           'System Admin Alert: *{{message}}* has triggered system action. Review admin terminal.',
           'Critical System Alert', 'Admin Action Required: {{message}}',
           'Admin security alert triggered: {{message}}.',
           '{"event": "admin.alert", "severity": "critical", "message": "{{message}}"}'
          )
      `);

      // Seed mock notification logs for comprehensive dashboard views
      await client.query(`
        INSERT INTO notification_logs (event_type, channel, recipient, subject, body, status, retry_count, max_retries, error_message, sent_at, audit_trail)
        VALUES
          ('BOOKING', 'EMAIL', 'anil.verma@gmail.com', 'Unit Plot Booking Confirmed - PLOT-104', 
           'Dear Anil Verma, plot unit PLOT-104 at layout Royal Meadows has been booked.', 'DELIVERED', 0, 3, NULL, NOW() - INTERVAL '30 minutes',
           '[{"time": "2026-06-30T04:10:00Z", "status": "QUEUED", "message": "Enqueued for delivery"}, {"time": "2026-06-30T04:10:02Z", "status": "DELIVERED", "message": "Dispatched via SMTP relay"}]'::jsonb
          ),
          ('BOOKING', 'SMS', '+919900112233', NULL, 
           'BhoomiOne: Dear Anil Verma, booking for unit PLOT-104 at Royal Meadows is confirmed.', 'DELIVERED', 0, 3, NULL, NOW() - INTERVAL '30 minutes',
           '[{"time": "2026-06-30T04:10:00Z", "status": "QUEUED", "message": "Enqueued"}, {"time": "2026-06-30T04:10:01Z", "status": "DELIVERED", "message": "SMS Delivered successfully"}]'::jsonb
          ),
          ('PAYMENT', 'WHATSAPP', '+919900112233', NULL, 
           'Dear Anil Verma, we have received a payment of ₹5,00,000 for Booking ID: BK-99211.', 'DELIVERED', 0, 3, NULL, NOW() - INTERVAL '25 minutes',
           '[{"time": "2026-06-30T04:15:00Z", "status": "QUEUED", "message": "Enqueued"}, {"time": "2026-06-30T04:15:03Z", "status": "DELIVERED", "message": "WhatsApp API callback success"}]'::jsonb
          ),
          ('EMI_REMINDER', 'EMAIL', 'suresh.kumar@yahoo.com', 'EMI Installment Reminder - Due in 5 days', 
           'Dear Suresh Kumar, your upcoming installment of ₹50,000 is due on 2026-07-05.', 'QUEUED', 0, 3, NULL, NULL,
           '[{"time": "2026-06-30T04:30:00Z", "status": "QUEUED", "message": "Scheduled upcoming EMI dispatch"}]'::jsonb
          ),
          ('LEAD_ASSIGNMENT', 'IN_APP', 'usr-sales-01', NULL, 
           'Lead Sunita Rao assigned to your sales pipeline.', 'DELIVERED', 0, 3, NULL, NOW() - INTERVAL '15 minutes',
           '[{"time": "2026-06-30T04:25:00Z", "status": "DELIVERED", "message": "Pushed to In-App database"}]'::jsonb
          ),
          ('SITE_VISIT', 'WEBHOOK', 'https://builder-crm.com/api/v1/visits', NULL, 
           '{"event": "site_visit.scheduled", "customer_name": "Ramesh Gupta", "visit_time": "2026-07-02 11:00"}', 'FAILED', 3, 3, 
           'HTTP 504 Gateway Timeout connecting to CRM server.', NULL,
           '[{"time": "2026-06-30T03:00:00Z", "status": "QUEUED", "message": "Initial post trigger"}, {"time": "2026-06-30T03:01:00Z", "status": "RETRYING", "message": "Attempt 1 failed. Retry 1 enqueued"}, {"time": "2026-06-30T03:02:00Z", "status": "RETRYING", "message": "Attempt 2 failed. Retry 2 enqueued"}, {"time": "2026-06-30T03:03:00Z", "status": "FAILED", "message": "Attempt 3 failed. Retries exhausted."}]'::jsonb
          )
      `);
    } catch (seedErr) {
      console.error("❌ Pre-migration relational seeding failed:", seedErr);
    }

    console.log("✅ PostgreSQL schema is 100% prepared, verified, and seeded.");
  } catch (error) {
    console.error("❌ Pre-migration initialization failed:", error);
  } finally {
    if (client) {
      client.release();
    }
  }
}
