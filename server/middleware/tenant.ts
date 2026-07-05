import { Request, Response, NextFunction } from "express";
import { getPool } from "../db/pool.ts";

export interface ResolvedTenant {
  id: string;
  tenantCode: string;
  companyName: string;
  status: string;
}

export interface TenantRequest extends Request {
  resolvedTenant?: ResolvedTenant;
}

export async function tenantResolverMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let tenantInput = req.headers["x-tenant-id"] as string;
  const host = req.headers.host || "";

  if (tenantInput) {
    tenantInput = tenantInput.trim().toLowerCase();
    if (tenantInput === "bhoomi-alpha") {
      tenantInput = "dev-01";
    } else if (tenantInput === "apex-plots") {
      tenantInput = "dev-02";
    }
  }

  const pool = getPool();

  try {
    // 1. Resolve via header (UUID or Tenant Code)
    if (tenantInput) {
      // Check if it's a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantInput);

      let tenantQuery = "";
      if (isUuid) {
        tenantQuery = "SELECT id, tenant_code, company_name, status FROM tenants WHERE id = $1";
      } else {
        tenantQuery = "SELECT id, tenant_code, company_name, status FROM tenants WHERE tenant_code = $1";
      }

      const tenantRes = await pool.query(tenantQuery, [tenantInput]);

      if (tenantRes.rows.length > 0) {
        const tenant = tenantRes.rows[0];
        if (tenant.status !== "ACTIVE") {
          res.status(403).json({ error: `Tenant workspace is currently: ${tenant.status}` });
          return;
        }

        req.resolvedTenant = {
          id: tenant.id,
          tenantCode: tenant.tenant_code,
          companyName: tenant.company_name,
          status: tenant.status,
        };
        next();
        return;
      }
    }

    // 2. Resolve via Domain parsing
    if (host) {
      // Clean host from port suffixes (e.g. localhost:3000 -> localhost)
      const cleanHost = host.split(":")[0].toLowerCase();

      const domainQuery = `
        SELECT t.id, t.tenant_code, t.company_name, t.status
        FROM tenant_domains td
        JOIN tenants t ON td.tenant_id = t.id
        WHERE td.domain_name = $1
      `;
      const domainRes = await pool.query(domainQuery, [cleanHost]);

      if (domainRes.rows.length > 0) {
        const tenant = domainRes.rows[0];
        if (tenant.status !== "ACTIVE") {
          res.status(403).json({ error: `Tenant workspace is currently: ${tenant.status}` });
          return;
        }

        req.resolvedTenant = {
          id: tenant.id,
          tenantCode: tenant.tenant_code,
          companyName: tenant.company_name,
          status: tenant.status,
        };
        next();
        return;
      }
    }

    // Fallback: Continue without throw, let target routes decide if tenant context is mandatory.
    next();
  } catch (err: any) {
    console.error("Error inside Tenant Resolver Middleware:", err);
    res.status(500).json({ error: "Tenant verification process failed. Please retry later." });
  }
}
