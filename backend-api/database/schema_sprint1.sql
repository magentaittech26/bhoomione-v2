-- =================================────────────────============================
-- BHOOMIONE V2: SPRINT 1 POSTGRESQL SCHEMA BLUEPRINT (PROD-READY DDL)
-- -----------------------------------------------------------------------------
-- Version: 2.0
-- Target Engine: PostgreSQL 16+ (Optimized for PostgreSQL 17)
-- All primary keys use UUID; binary JSONB is leveraged for audit trailing.
-- Minimal indexes are configured specifically on lookup boundaries.
-- =================================────────────────============================

-- Ensure UUID extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TENANCY SCHEMAS
-- -----------------------------------------------------------------------------

-- Tenants Table: Core developers subscription workspaces
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_code VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, SUSPENDED, DELETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tenant Domains: Hosts resolution records mapped for the Nginx proxy router
CREATE TABLE IF NOT EXISTS tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. USER INDENTITIES
-- -----------------------------------------------------------------------------

-- Users Table: Central user registry (shared across platform and tenants)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, BLACKLISTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. ROLE-BASED ACCESS CONTROL (RBAC)
-- -----------------------------------------------------------------------------

-- Roles Table: Action control scopes (Platform-level vs Tenant-level)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- SUPER_ADMIN, PLATFORM_ADMIN, TENANT_DEVELOPER_OWNER, etc.
    name VARCHAR(255) NOT NULL,
    scope VARCHAR(50) NOT NULL DEFAULT 'TENANT', -- GLOBAL (Platform level), TENANT (Tenant ERP level)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table: High-granularity capability-specific flags
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'developer:onboard', 'kyc:approve', 'project:create'
    name VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL, -- e.g. 'identity', 'platform', 'kyc', 'billing'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permissions Join-Table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- User-Roles Table: Explicit linkage between users and global roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Tenant-Users: Links users to workspaces and grants platform roles scoped only to that tenant
CREATE TABLE IF NOT EXISTS tenant_users (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 4. TRUSTED AUDITING & TRANSACTION WRITE-ASIDE
-- -----------------------------------------------------------------------------

-- Audit Logs Table: Secure storage tracking exact record transformations
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, -- Null implies platform-level system actions
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_name VARCHAR(100) NOT NULL, -- Table identifier (e.g. 'tenants', 'users')
    entity_id UUID NOT NULL, -- Record Key UUID
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, AUTH_FAILED
    old_values JSONB, -- Pre-transaction state properties
    new_values JSONB, -- Post-transaction state properties
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. PERFORMANCE LOOKUP INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON tenant_domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
