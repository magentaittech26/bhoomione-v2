import { Router, Response } from "express";
import crypto from "crypto";
import { getPool } from "../db/pool.ts";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.ts";
import { AuditLogService } from "../services/audit.ts";

const router = Router();

// Permission verification helper
async function checkPermission(req: AuthenticatedRequest, res: Response, permission: string): Promise<boolean> {
  const roleUpper = req.user?.role ? req.user.role.toUpperCase() : "";
  const isAdmin = ["DEVELOPER_OWNER", "DEVELOPER_ADMIN", "PLATFORM_ADMIN", "TENANT_OWNER", "TENANT_ADMIN", "OWNER", "ADMIN"].includes(roleUpper);
  if (isAdmin) {
    return true;
  }
  
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  if (!tenantId || !userId) {
    res.status(401).json({ error: "Unauthorized. Missing user or tenant context." });
    return false;
  }
  
  const db = getPool();
  try {
    const permQuery = await db.query(
      `SELECT COUNT(*) as count
       FROM tenant_users tu
       JOIN role_permissions rp ON tu.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE tu.user_id = $1 AND tu.tenant_id = $2 AND p.code = $3`,
      [userId, tenantId, permission]
    );
    const count = parseInt(permQuery.rows[0]?.count || "0", 10);
    if (count > 0) {
      return true;
    }
  } catch (err) {
    console.error("Error in checkPermission:", err);
  }
  
  res.status(403).json({ error: `Forbidden. Insufficient permissions: ${permission}` });
  return false;
}

// GET /api/v1/measurement-units
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hasPerm = await checkPermission(req, res, "masters.measurement_units.view");
    if (!hasPerm) return;

    const db = getPool();
    const {
      page = 1,
      per_page = 50,
      search = "",
      is_active,
      active_only,
      measurement_type,
      sort_by = "display_order",
      sort_order = "ASC"
    } = req.query;

    const limit = Math.max(1, parseInt(per_page as string, 10));
    const offset = (Math.max(1, parseInt(page as string, 10)) - 1) * limit;

    let queryStr = `SELECT * FROM measurement_units WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      queryStr += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR display_name ILIKE $${params.length} OR symbol ILIKE $${params.length})`;
    }

    if (is_active !== undefined) {
      params.push(is_active === "true");
      queryStr += ` AND is_active = $${params.length}`;
    } else if (active_only === "true") {
      params.push(true);
      queryStr += ` AND is_active = $${params.length}`;
    }

    if (measurement_type) {
      params.push(measurement_type);
      queryStr += ` AND measurement_type = $${params.length}`;
    }

    // Validate sort column to avoid SQL injection
    const allowedSortCols = ["name", "code", "display_name", "symbol", "measurement_type", "display_order", "conversion_factor", "created_at"];
    const validSortCol = allowedSortCols.includes(sort_by as string) ? sort_by : "display_order";
    const validSortOrder = (sort_order as string).toUpperCase() === "DESC" ? "DESC" : "ASC";

    queryStr += ` ORDER BY ${validSortCol} ${validSortOrder}`;

    // Count total query
    const countQuery = queryStr.replace("SELECT *", "SELECT COUNT(*) as count");
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    // Add LIMIT and OFFSET
    params.push(limit, offset);
    queryStr += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(queryStr, params);

    res.json({
      data: result.rows,
      meta: {
        total,
        page: Math.max(1, parseInt(page as string, 10)),
        per_page: limit,
        last_page: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error("fetchMeasurementUnits Route Error:", err);
    res.status(500).json({ error: "Failed to fetch measurement units master." });
  }
});

// GET /api/v1/measurement-units/lookup
router.get("/lookup", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getPool();
    const result = await db.query(
      "SELECT * FROM measurement_units WHERE is_active = TRUE AND deleted_at IS NULL ORDER BY display_order ASC, code ASC"
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    console.error("fetchMeasurementUnits Lookup Error:", err);
    res.status(500).json({ error: "Failed to fetch measurement units lookup." });
  }
});

// GET /api/v1/measurement-units/:id
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hasPerm = await checkPermission(req, res, "masters.measurement_units.view");
    if (!hasPerm) return;

    const db = getPool();
    const { id } = req.params;

    const result = await db.query(
      "SELECT * FROM measurement_units WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Measurement unit not found." });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (err: any) {
    console.error("getMeasurementUnit Route Error:", err);
    res.status(500).json({ error: "Failed to retrieve measurement unit." });
  }
});

// POST /api/v1/measurement-units
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hasPerm = await checkPermission(req, res, "masters.measurement_units.create");
    if (!hasPerm) return;

    const db = getPool();
    const {
      code,
      name,
      display_name,
      symbol,
      short_code,
      measurement_type = "Area",
      conversion_factor,
      base_unit,
      precision,
      decimal_places,
      display_order,
      is_metric = false,
      is_default = false,
      is_system = false,
      is_active = true,
      country_code,
      state_code,
      tenant_override_allowed = true,
      description
    } = req.body;

    const errors: Record<string, string[]> = {};

    // Validate code
    if (!code || typeof code !== "string" || !code.trim()) {
      errors.code = ["Code is required."];
    }
    
    // Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      errors.name = ["Name is required."];
    }

    // Validate measurement type
    if (!measurement_type || typeof measurement_type !== "string" || !measurement_type.trim()) {
      errors.measurement_type = ["Measurement type is required."];
    }

    // Validate conversion factor
    if (conversion_factor === undefined || conversion_factor === null || isNaN(Number(conversion_factor))) {
      errors.conversion_factor = ["Conversion factor is required."];
    } else if (Number(conversion_factor) <= 0) {
      errors.conversion_factor = ["Conversion factor must be greater than zero."];
    }

    // Validate precision and decimal_places
    const precNum = Number(precision ?? 2);
    if (isNaN(precNum) || precNum < 0 || precNum > 6) {
      errors.precision = ["Precision must be an integer between 0 and 6."];
    }

    const decNum = Number(decimal_places ?? 2);
    if (isNaN(decNum) || decNum < 0 || decNum > 6) {
      errors.decimal_places = ["Decimal places must be an integer between 0 and 6."];
    }

    // Validate display order
    if (display_order !== undefined && display_order !== null && isNaN(Number(display_order))) {
      errors.display_order = ["Display order must be an integer."];
    }

    // Validate country / state code formats
    if (country_code && (typeof country_code !== "string" || country_code.trim().length > 10)) {
      errors.country_code = ["Country code must be a string up to 10 characters."];
    }
    if (state_code && (typeof state_code !== "string" || state_code.trim().length > 10)) {
      errors.state_code = ["State code must be a string up to 10 characters."];
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors
      });
      return;
    }

    const normCode = code.toUpperCase().trim();

    // Check for duplicate code
    const dupCheck = await db.query(
      "SELECT id FROM measurement_units WHERE code = $1 AND deleted_at IS NULL",
      [normCode]
    );
    if (dupCheck.rowCount > 0) {
      res.status(409).json({
        success: false,
        message: "Validation failed.",
        errors: {
          code: [`The code '${normCode}' has already been used.`]
        }
      });
      return;
    }

    // Protect system/default fields from unauthorized tenant users
    const roleUpper = req.user?.role ? req.user.role.toUpperCase() : "";
    const isPlatformAdmin = ["DEVELOPER_OWNER", "DEVELOPER_ADMIN", "PLATFORM_ADMIN"].includes(roleUpper);
    if ((is_system || is_default) && !isPlatformAdmin) {
      res.status(403).json({
        success: false,
        error: "Forbidden. Tenant users are not authorized to create platform-wide system defaults."
      });
      return;
    }

    // Transaction to unset previous default if is_default is true
    await db.query("BEGIN");
    try {
      if (is_default) {
        await db.query(
          "UPDATE measurement_units SET is_default = FALSE WHERE measurement_type = $1 AND deleted_at IS NULL",
          [measurement_type]
        );
      }

      const newId = crypto.randomUUID();
      const uuidVal = newId;

      const insertQuery = `
        INSERT INTO measurement_units (
          id, uuid, code, name, display_name, symbol, short_code, measurement_type,
          conversion_factor, conversion_to_sqft, base_unit, precision, decimal_places,
          display_order, is_metric, is_default, is_system, is_active,
          country_code, state_code, tenant_override_allowed, description
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        ) RETURNING *
      `;

      const result = await db.query(insertQuery, [
        newId,
        uuidVal,
        normCode,
        name.trim(),
        (display_name || name).trim(),
        symbol || null,
        short_code || normCode,
        measurement_type,
        Number(conversion_factor),
        Number(conversion_factor), // conversion_to_sqft
        base_unit || "SQFT",
        precNum,
        decNum,
        Number(display_order || 0),
        !!is_metric,
        !!is_default,
        !!is_system,
        !!is_active,
        country_code || null,
        state_code || null,
        !!tenant_override_allowed,
        description || null
      ]);

      const createdUnit = result.rows[0];

      await db.query("COMMIT");

      // Log Audit Trail
      await AuditLogService.log({
        tenantId: req.user?.tenantId || null,
        userId: req.user?.userId || null,
        entityName: "measurement_units",
        entityId: createdUnit.id,
        action: "PLOT_CREATE" as any,
        newValues: createdUnit
      });

      res.status(201).json({
        success: true,
        data: createdUnit
      });
    } catch (txErr) {
      await db.query("ROLLBACK");
      throw txErr;
    }
  } catch (err: any) {
    console.error("createMeasurementUnit Route Error:", err);
    res.status(500).json({ error: "Failed to create measurement unit." });
  }
});

// PUT /api/v1/measurement-units/:id
router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hasPerm = await checkPermission(req, res, "masters.measurement_units.edit");
    if (!hasPerm) return;

    const db = getPool();
    const { id } = req.params;

    const unitCheck = await db.query(
      "SELECT * FROM measurement_units WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    if (unitCheck.rowCount === 0) {
      res.status(404).json({ error: "Measurement unit not found." });
      return;
    }

    const oldUnit = unitCheck.rows[0];

    const {
      name,
      display_name,
      symbol,
      short_code,
      measurement_type,
      conversion_factor,
      base_unit,
      precision,
      decimal_places,
      display_order,
      is_metric,
      is_default,
      is_system,
      is_active,
      country_code,
      state_code,
      tenant_override_allowed,
      description
    } = req.body;

    const errors: Record<string, string[]> = {};

    // Validate conversion factor if provided
    if (conversion_factor !== undefined && conversion_factor !== null) {
      if (isNaN(Number(conversion_factor))) {
        errors.conversion_factor = ["Conversion factor must be a number."];
      } else if (Number(conversion_factor) <= 0) {
        errors.conversion_factor = ["Conversion factor must be greater than zero."];
      }
    }

    // Validate precision and decimal_places if provided
    if (precision !== undefined && precision !== null) {
      const precNum = Number(precision);
      if (isNaN(precNum) || precNum < 0 || precNum > 6) {
        errors.precision = ["Precision must be an integer between 0 and 6."];
      }
    }
    if (decimal_places !== undefined && decimal_places !== null) {
      const decNum = Number(decimal_places);
      if (isNaN(decNum) || decNum < 0 || decNum > 6) {
        errors.decimal_places = ["Decimal places must be an integer between 0 and 6."];
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors
      });
      return;
    }

    // Protect system/default fields from unauthorized tenant users
    const roleUpper = req.user?.role ? req.user.role.toUpperCase() : "";
    const isPlatformAdmin = ["DEVELOPER_OWNER", "DEVELOPER_ADMIN", "PLATFORM_ADMIN"].includes(roleUpper);
    if ((is_system !== undefined || is_default !== undefined) && !isPlatformAdmin) {
      if ((is_system !== undefined && is_system !== oldUnit.is_system) || 
          (is_default !== undefined && is_default !== oldUnit.is_default)) {
        res.status(403).json({
          success: false,
          error: "Forbidden. Tenant users are not authorized to modify platform-wide system defaults."
        });
        return;
      }
    }

    const targetType = measurement_type || oldUnit.measurement_type;

    await db.query("BEGIN");
    try {
      if (is_default && !oldUnit.is_default) {
        await db.query(
          "UPDATE measurement_units SET is_default = FALSE WHERE measurement_type = $1 AND deleted_at IS NULL",
          [targetType]
        );
      }

      const updateQuery = `
        UPDATE measurement_units SET
          name = COALESCE($1, name),
          display_name = COALESCE($2, display_name),
          symbol = COALESCE($3, symbol),
          short_code = COALESCE($4, short_code),
          measurement_type = COALESCE($5, measurement_type),
          conversion_factor = COALESCE($6, conversion_factor),
          conversion_to_sqft = COALESCE($6, conversion_to_sqft),
          base_unit = COALESCE($7, base_unit),
          precision = COALESCE($8, precision),
          decimal_places = COALESCE($9, decimal_places),
          display_order = COALESCE($10, display_order),
          is_metric = COALESCE($11, is_metric),
          is_default = COALESCE($12, is_default),
          is_system = COALESCE($13, is_system),
          is_active = COALESCE($14, is_active),
          country_code = COALESCE($15, country_code),
          state_code = COALESCE($16, state_code),
          tenant_override_allowed = COALESCE($17, tenant_override_allowed),
          description = COALESCE($18, description),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $19 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await db.query(updateQuery, [
        name !== undefined && name !== null ? name.trim() : null,
        display_name !== undefined && display_name !== null ? display_name.trim() : null,
        symbol !== undefined ? symbol : null,
        short_code !== undefined ? short_code : null,
        measurement_type !== undefined ? measurement_type : null,
        conversion_factor !== undefined ? Number(conversion_factor) : null,
        base_unit !== undefined ? base_unit : null,
        precision !== undefined ? Number(precision) : null,
        decimal_places !== undefined ? Number(decimal_places) : null,
        display_order !== undefined ? Number(display_order) : null,
        is_metric !== undefined ? !!is_metric : null,
        is_default !== undefined ? !!is_default : null,
        is_system !== undefined ? !!is_system : null,
        is_active !== undefined ? !!is_active : null,
        country_code !== undefined ? country_code : null,
        state_code !== undefined ? state_code : null,
        tenant_override_allowed !== undefined ? !!tenant_override_allowed : null,
        description !== undefined ? description : null,
        id
      ]);

      const updatedUnit = result.rows[0];

      await db.query("COMMIT");

      // Log Audit Trail
      await AuditLogService.log({
        tenantId: req.user?.tenantId || null,
        userId: req.user?.userId || null,
        entityName: "measurement_units",
        entityId: id,
        action: "PLOT_UPDATE" as any,
        oldValues: oldUnit,
        newValues: updatedUnit
      });

      res.json({ success: true, data: updatedUnit });
    } catch (txErr) {
      await db.query("ROLLBACK");
      throw txErr;
    }
  } catch (err: any) {
    console.error("updateMeasurementUnit Route Error:", err);
    res.status(500).json({ error: "Failed to update measurement unit." });
  }
});

// DELETE /api/v1/measurement-units/:id
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hasPerm = await checkPermission(req, res, "masters.measurement_units.delete");
    if (!hasPerm) return;

    const db = getPool();
    const { id } = req.params;

    const unitCheck = await db.query(
      "SELECT * FROM measurement_units WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    if (unitCheck.rowCount === 0) {
      res.status(404).json({ error: "Measurement unit not found." });
      return;
    }

    const oldUnit = unitCheck.rows[0];

    // Soft delete by setting deleted_at
    await db.query(
      "UPDATE measurement_units SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    // Log Audit Trail
    await AuditLogService.log({
      tenantId: req.user?.tenantId || null,
      userId: req.user?.userId || null,
      entityName: "measurement_units",
      entityId: id,
      action: "PLOT_DELETE" as any,
      oldValues: oldUnit,
      newValues: { ...oldUnit, deleted_at: new Date().toISOString() }
    });

    res.json({ success: true, message: "Measurement unit soft deleted successfully." });
  } catch (err: any) {
    console.error("deleteMeasurementUnit Route Error:", err);
    res.status(500).json({ error: "Failed to delete measurement unit." });
  }
});

export default router;
