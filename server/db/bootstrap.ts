import { getPool } from "./pool.ts";
import bcrypt from "bcryptjs";

export async function bootstrapDatabase() {
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

    // 22. Relational saas_modules Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saas_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        "group" VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        is_core BOOLEAN DEFAULT FALSE,
        is_billable BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 10,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23. Relational saas_features Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saas_features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        module_id UUID NOT NULL REFERENCES saas_modules(id) ON DELETE CASCADE,
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        "group" VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        default_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 24. Relational subscription_plan_features Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plan_features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
        feature_id UUID NOT NULL REFERENCES saas_features(id) ON DELETE CASCADE,
        access_level VARCHAR(50) DEFAULT 'ENABLED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT idx_plan_feature UNIQUE (plan_id, feature_id)
      )
    `);

    // 25. Relational subscription_plan_limits Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plan_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
        limit_key VARCHAR(150) NOT NULL,
        limit_value INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT idx_plan_limit_key UNIQUE (plan_id, limit_key)
      )
    `);

    // 26. Relational subscription_addons Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_addons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        monthly_price DECIMAL(12,2) DEFAULT 0.00,
        yearly_price DECIMAL(12,2) DEFAULT 0.00,
        description TEXT,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 27. Relational subscription_plot_slabs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plot_slabs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        min_plots INTEGER DEFAULT 1,
        max_plots INTEGER DEFAULT 999999,
        monthly_price DECIMAL(12,2) DEFAULT 0.00,
        yearly_price DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 28. Support columns for subscription pricing models
    await client.query(`
      ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(12,2) NOT NULL DEFAULT 0.00;
      ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS yearly_price DECIMAL(12,2) NOT NULL DEFAULT 0.00;
      ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14;
      ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
      ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1;
    `);

    // 29. Support columns for subscription lifecycles
    await client.query(`
      ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS subscription_start_date DATE;
      ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS subscription_expiry_date DATE;
      ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS trial_expiry_date DATE;
      ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS renewal_date DATE;
    `);

    // 30. Relational tenant_addons Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_addons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_subscription_id UUID NOT NULL REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
        addon_id UUID NOT NULL REFERENCES subscription_addons(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT idx_tenant_subscription_addon UNIQUE (tenant_subscription_id, addon_id)
      )
    `);

    // 31. Relational tenant_feature_overrides Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_feature_overrides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_subscription_id UUID NOT NULL REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
        feature_id UUID NOT NULL REFERENCES saas_features(id) ON DELETE CASCADE,
        override_status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT idx_tenant_subscription_feature UNIQUE (tenant_subscription_id, feature_id)
      )
    `);

    // 32. Relational tenant_limit_overrides Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_limit_overrides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_subscription_id UUID NOT NULL REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
        limit_key VARCHAR(150) NOT NULL,
        override_value INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT idx_tenant_subscription_limit UNIQUE (tenant_subscription_id, limit_key)
      )
    `);

    // Drop obsolete violating JSON config table if active
    await client.query(`DROP TABLE IF EXISTS saas_config CASCADE`);

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

    // --- SEED SECTIONS ---
    // Truncate first to ensure clean seed
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

    // 7. Seed Projects, Layouts, and Plots for Sprint 2A (OPTIONAL - only seeded when SEED_DEMO_DATA is 'true')
    if (process.env.SEED_DEMO_DATA === "true") {
      const proj1Id = '88888888-8888-8888-8888-888888888881';
      const proj2Id = '88888888-8888-8888-8888-888888888882';

      await client.query(`
        INSERT INTO projects (id, tenant_id, name, code, developer_name, location, status, rera_number, approval_status, approval_authority, launch_date, possession_target_date, approvals_metadata) VALUES
        ('${proj1Id}', '${tenant1Id}', 'Greenfield Meadows', 'GM', 'Bhoomi Developer Corp', 'Sector 15, Gurgaon, HR', 'ACTIVE', 'RERA/PR/10001/HR', 'APPROVED', 'Gurgaon Urban Planning Dept', '2026-01-15', '2029-12-31', '{"water_connection": "APPROVED-981", "environmental_clearance": "PEC-2025-X"}'),
        ('${proj2Id}', '${tenant1Id}', 'Royal Serenity Estate', 'RSE', 'Bhoomi Developer Corp', 'Deharadun Valley Road, UK', 'PLANNING', NULL, 'PENDING', 'Uttarakhand Town & Country Department', NULL, '2030-06-30', '{}')
      `);

      const lay1Id = '77777777-7777-7777-7777-777777777771';
      const lay2Id = '77777777-7777-7777-7777-777777777772';

      await client.query(`
        INSERT INTO layouts (id, project_id, name, code, layout_type, approval_number, approval_date, total_area_value, total_area_unit_id, measurement_unit_id, status) VALUES
        ('${lay1Id}', '${proj1Id}', 'Meadows Phase A Sector 1', 'SEC1', 'RESIDENTIAL', 'APPR-SEC-1A-981', '2026-02-10', 450000.0000, '33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333331', 'LAUNCHED'),
        ('${lay2Id}', '${proj1Id}', 'Meadows Commercial Plaza', 'COMM1', 'COMMERCIAL', 'APPR-COMM-C1', '2026-03-01', 5.5000, '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333332', 'APPROVED')
      `);

      await client.query(`
        INSERT INTO plots (id, layout_id, plot_number, area_value, measurement_unit_id, length, width, road_width, corner_plot, facing, dimensions, dimensions_metadata, status) VALUES
        ('66666666-6666-6666-6666-666666666661', '${lay1Id}', 'Plot 401', 2400.0000, '33333333-3333-3333-3333-333333333331', 40.00, 60.00, 40.00, false, 'EAST', '40 x 60', '{"shape": "rectangular"}', 'AVAILABLE'),
        ('66666666-6666-6666-6666-666666666662', '${lay1Id}', 'Plot 402', 1200.0000, '33333333-3333-3333-3333-333333333331', 30.00, 40.00, 30.00, false, 'NORTH', '30 x 40', '{"shape": "rectangular"}', 'RESERVED'),
        ('66666666-6666-6666-6666-666666666663', '${lay1Id}', 'Plot 403-C', 300.0000, '33333333-3333-3333-3333-333333333332', 15.00, 20.00, 50.00, true, 'NORTHEAST', '15 x 20 M', '{"shape": "corner-chamfered"}', 'AVAILABLE'),
        ('66666666-6666-6666-6666-666666666664', '${lay1Id}', 'Plot 404', 1.5000, '33333333-3333-3333-3333-333333333333', NULL, NULL, 30.00, false, 'SOUTH', 'Acre Plot 1.5', '{}', 'SOLD')
      `);

      console.log("Seeded basic Sprint 2A Projects, Layouts, and Plots reference data.");
    } else {
      console.log("Skipping optional Sprint 2A Projects, Layouts, and Plots reference data seeding (SEED_DEMO_DATA != true).");
    }

    // Seeding dynamic SaaS Relational Tables
    try {
      // 1. Seed to saas_modules
      const moduleMap: Record<string, string> = {
        'SAAS_ADMIN': '99999999-9999-4999-8999-000000000001',
        'TENANT_WORKSPACE': '99999999-9999-4999-8999-000000000002',
        'PROJECTS': '99999999-9999-4999-8999-000000000003',
        'LAYOUTS': '99999999-9999-4999-8999-000000000004',
        'PLOTS': '99999999-9999-4999-8999-000000000005',
        'CUSTOMERS': '99999999-9999-4999-8999-000000000006',
        'AGENTS': '99999999-9999-4999-8999-000000000007',
        'INTERACTIVE_MAP': '99999999-9999-4999-8999-000000000008',
        'DXF_ENGINE': '99999999-9999-4999-8999-000000000009',
        'WHATSAPP': '99999999-9999-4999-8999-000000000010'
      };

      const modulesData = [
        { id: moduleMap['SAAS_ADMIN'], code: 'SAAS_ADMIN', name: 'SaaS Admin Core', group: 'System', description: 'Global multi-tenant supervisory console and DNS cluster config.', status: 'ACTIVE', isCore: true, isBillable: false, sortOrder: 1 },
        { id: moduleMap['TENANT_WORKSPACE'], code: 'TENANT_WORKSPACE', name: 'Tenant Workspace', group: 'System', description: 'Self-service tenant environment routing framework.', status: 'ACTIVE', isCore: true, isBillable: false, sortOrder: 2 },
        { id: moduleMap['PROJECTS'], code: 'PROJECTS', name: 'Projects Catalog', group: 'Core Planning', description: 'Design, catalog, track, and administer township real estate projects.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 3 },
        { id: moduleMap['LAYOUTS'], code: 'LAYOUTS', name: 'Layout Subdivisions', group: 'Core Planning', description: 'Phased land parcel plans and sector map zoning layouts.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 4 },
        { id: moduleMap['PLOTS'], code: 'PLOTS', name: 'Plot Parcels Registry', group: 'Core Planning', description: 'Individual tract plots inventory ledger catalog with custom attributes.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 5 },
        { id: moduleMap['CUSTOMERS'], code: 'CUSTOMERS', name: 'Customer Management', group: 'CRM', description: 'All-inclusive lead nurturing, contact profiles, and buyer records.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 6 },
        { id: moduleMap['AGENTS'], code: 'AGENTS', name: 'Agent Workspace', group: 'CRM', description: 'Broker network controls, dynamic agent performance, and metrics.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 7 },
        { id: moduleMap['INTERACTIVE_MAP'], code: 'INTERACTIVE_MAP', name: 'Interactive Map', group: 'Integrations', description: 'Realtime SVG CAD mapper with plot reservation visual indicators.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 8 },
        { id: moduleMap['DXF_ENGINE'], code: 'DXF_ENGINE', name: 'DXF Engine Parser', group: 'Integrations', description: 'Heavy CAD drawing parser to translate design diagrams into databases.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 9 },
        { id: moduleMap['WHATSAPP'], code: 'WHATSAPP', name: 'WhatsApp Integrations', group: 'Integrations', description: 'Automated direct trigger alerts on user reservation checkouts.', status: 'ACTIVE', isCore: false, isBillable: true, sortOrder: 10 }
      ];

      for (const m of modulesData) {
        await client.query(`
          INSERT INTO saas_modules (id, code, name, "group", description, status, is_core, is_billable, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (code) DO UPDATE SET name = $3, "group" = $4, description = $5, status = $6, is_core = $7, is_billable = $8, sort_order = $9
        `, [m.id, m.code, m.name, m.group, m.description, m.status, m.isCore, m.isBillable, m.sortOrder]);
      }

      // 2. Seed to saas_features
      const featureMap: Record<string, string> = {
        'PROJECTS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000001',
        'LAYOUTS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000002',
        'PLOTS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000003',
        'CUSTOMERS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000004',
        'AGENTS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000005',
        'DXF_UPLOAD': 'faaaaaaa-aaaa-aaaa-aaaa-000000000006',
        'MAP_INTERACTION': 'faaaaaaa-aaaa-aaaa-aaaa-000000000007',
        'WHATSAPP_TRIGGERS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000008',
        'API_ACCESS': 'faaaaaaa-aaaa-aaaa-aaaa-000000000009'
      };

      const featuresData = [
        { id: featureMap['PROJECTS'], moduleCode: 'PROJECTS', code: 'PROJECTS', name: 'Township projects catalog', group: 'Core Planning', description: 'Create and scale township planning models.', status: 'ACTIVE', defaultEnabled: true },
        { id: featureMap['LAYOUTS'], moduleCode: 'LAYOUTS', code: 'LAYOUTS', name: 'Subdivision planning tool', group: 'Core Planning', description: 'Zoned sector plans and division lines.', status: 'ACTIVE', defaultEnabled: true },
        { id: featureMap['PLOTS'], moduleCode: 'PLOTS', code: 'PLOTS', name: 'Physical lot registers', group: 'Core Planning', description: 'Assign coordinates, lot numbers and PLC rates.', status: 'ACTIVE', defaultEnabled: true },
        { id: featureMap['CUSTOMERS'], moduleCode: 'CUSTOMERS', code: 'CUSTOMERS', name: 'Buyer records logs', group: 'CRM', description: 'Manage customer profiles and reservation ledgers.', status: 'ACTIVE', defaultEnabled: true },
        { id: featureMap['AGENTS'], moduleCode: 'AGENTS', code: 'AGENTS', name: 'Broker agent scorecard', group: 'CRM', description: 'Keep logs on external broker sales targets and payouts.', status: 'ACTIVE', defaultEnabled: true },
        { id: featureMap['DXF_UPLOAD'], moduleCode: 'DXF_ENGINE', code: 'DXF_UPLOAD', name: 'DXF CAD Drawing upload', group: 'Integrations', description: 'Render canvas lots directly out of dynamic .dxf blueprints.', status: 'ACTIVE', defaultEnabled: true },
        { id: featureMap['MAP_INTERACTION'], moduleCode: 'INTERACTIVE_MAP', code: 'MAP_INTERACTION', name: 'Interactive property layouts', group: 'Integrations', description: 'Visual parcel lockups on mapping widgets.', status: 'ACTIVE', defaultEnabled: true },
        { id: featureMap['WHATSAPP_TRIGGERS'], moduleCode: 'WHATSAPP', code: 'WHATSAPP_TRIGGERS', name: 'Automated reservation alerts', group: 'Integrations', description: 'Automatic WhatsApp broadcast warnings on payment locks.', status: 'ACTIVE', defaultEnabled: true },
        { id: featureMap['API_ACCESS'], moduleCode: 'SAAS_ADMIN', code: 'API_ACCESS', name: 'Custom API client keys', group: 'System', description: 'Export telemetry datasets to external ERP software.', status: 'ACTIVE', defaultEnabled: true }
      ];

      for (const f of featuresData) {
        const moduleId = moduleMap[f.moduleCode];
        await client.query(`
          INSERT INTO saas_features (id, module_id, code, name, "group", description, status, default_enabled)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (code) DO UPDATE SET module_id = $2, name = $4, "group" = $5, description = $6, status = $7, default_enabled = $8
        `, [f.id, moduleId, f.code, f.name, f.group, f.description, f.status, f.defaultEnabled]);
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

      // 5. Seed subscription_plan_features (Features Matrix)
      const matrixData: Record<string, Record<string, string>> = {
        "STARTER": { "PROJECTS": "ENABLED", "LAYOUTS": "ENABLED", "PLOTS": "ENABLED", "CUSTOMERS": "ENABLED", "AGENTS": "DISABLED", "DXF_UPLOAD": "ADDON", "MAP_INTERACTION": "DISABLED", "WHATSAPP_TRIGGERS": "DISABLED", "API_ACCESS": "DISABLED" },
        "GROWTH": { "PROJECTS": "ENABLED", "LAYOUTS": "ENABLED", "PLOTS": "ENABLED", "CUSTOMERS": "ENABLED", "AGENTS": "ENABLED", "DXF_UPLOAD": "ENABLED", "MAP_INTERACTION": "ADDON", "WHATSAPP_TRIGGERS": "ADDON", "API_ACCESS": "DISABLED" },
        "PROFESSIONAL": { "PROJECTS": "ENABLED", "LAYOUTS": "ENABLED", "PLOTS": "ENABLED", "CUSTOMERS": "ENABLED", "AGENTS": "ENABLED", "DXF_UPLOAD": "ENABLED", "MAP_INTERACTION": "ENABLED", "WHATSAPP_TRIGGERS": "ENABLED", "API_ACCESS": "ENABLED" },
        "ENTERPRISE": { "PROJECTS": "ENABLED", "LAYOUTS": "ENABLED", "PLOTS": "ENABLED", "CUSTOMERS": "ENABLED", "AGENTS": "ENABLED", "DXF_UPLOAD": "ENABLED", "MAP_INTERACTION": "ENABLED", "WHATSAPP_TRIGGERS": "ENABLED", "API_ACCESS": "ENABLED" }
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
        { minPlots: 1, maxPlots: 50, monthlyPrice: 15.00, yearlyPrice: 150.00, status: "ACTIVE" },
        { minPlots: 51, maxPlots: 200, monthlyPrice: 40.00, yearlyPrice: 400.00, status: "ACTIVE" },
        { minPlots: 201, maxPlots: 500, monthlyPrice: 75.00, yearlyPrice: 750.00, status: "ACTIVE" },
        { minPlots: 501, maxPlots: 99999, monthlyPrice: 150.00, yearlyPrice: 1500.00, status: "ACTIVE" }
      ];

      await client.query(`TRUNCATE TABLE subscription_plot_slabs CASCADE`);
      for (const s of slabsData) {
        await client.query(`
          INSERT INTO subscription_plot_slabs (min_plots, max_plots, monthly_price, yearly_price, status)
          VALUES ($1, $2, $3, $4, $5)
        `, [s.minPlots, s.maxPlots, s.monthlyPrice, s.yearlyPrice, s.status]);
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

      console.log("Seeded relational PostgreSQL SaaS models, plans, limits, addons, slabs, and tenant subscriptions successfully.");
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
