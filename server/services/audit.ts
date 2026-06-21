import { getPool } from "../db/pool.ts";

export interface CreateAuditLogParams {
  tenantId?: string | null;
  userId?: string | null;
  entityName: string;
  entityId: string;
  action: "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "LOGOUT" | "TOKEN_REFRESH" | "PASSWORD_RESET_REQUEST" | "PASSWORD_RESET_SUBMIT" | "PROJECT_CREATE" | "PROJECT_UPDATE" | "PROJECT_DELETE" | "LAYOUT_CREATE" | "LAYOUT_UPDATE" | "LAYOUT_DELETE" | "PLOT_CREATE" | "PLOT_UPDATE" | "PLOT_DELETE";
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogService {
  static async log(params: CreateAuditLogParams): Promise<void> {
    const pool = getPool();
    const query = `
      INSERT INTO audit_logs (
        tenant_id,
        user_id,
        entity_name,
        entity_id,
        action,
        old_values,
        new_values,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const values = [
      params.tenantId || null,
      params.userId || null,
      params.entityName,
      params.entityId,
      params.action,
      params.oldValues ? JSON.stringify(params.oldValues) : null,
      params.newValues ? JSON.stringify(params.newValues) : null,
      params.ipAddress || null,
      params.userAgent || null,
    ];

    try {
      await pool.query(query, values);
      console.log(`[AUDIT LOG] Action: ${params.action} recorded on ${params.entityName} (${params.entityId})`);
    } catch (err) {
      console.error("⚠️ Failed to write audit log to PostgreSQL:", err);
    }
  }
}
