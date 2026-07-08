import { Router, Response } from "express";
import { getPool } from "../db/pool.ts";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.ts";

const router = Router();

// ==========================================
// GEOGRAPHY MASTERS (Core Masters Wrapper)
// ==========================================
router.get("/geography/states", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getPool();
    const result = await db.query("SELECT * FROM location_states ORDER BY name ASC");
    res.json({ data: result.rows });
  } catch (err: any) {
    console.error("fetchCoreGeographyStates Error:", err);
    res.status(500).json({ error: "Failed to fetch geography states master." });
  }
});

router.get("/geography/districts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { state_id } = req.query;
    if (!state_id) return res.status(400).json({ error: "state_id query parameter required." });
    const db = getPool();
    const result = await db.query(
      "SELECT * FROM location_districts WHERE state_id = $1 ORDER BY name ASC",
      [state_id]
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    console.error("fetchCoreGeographyDistricts Error:", err);
    res.status(500).json({ error: "Failed to fetch geography districts master." });
  }
});

router.get("/geography/taluks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { district_id } = req.query;
    if (!district_id) return res.status(400).json({ error: "district_id query parameter required." });
    const db = getPool();
    const result = await db.query(
      "SELECT * FROM location_taluks WHERE district_id = $1 ORDER BY name ASC",
      [district_id]
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    console.error("fetchCoreGeographyTaluks Error:", err);
    res.status(500).json({ error: "Failed to fetch geography taluks master." });
  }
});

router.get("/geography/cities", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { district_id } = req.query;
    if (!district_id) return res.status(400).json({ error: "district_id query parameter required." });
    const db = getPool();
    const result = await db.query(
      "SELECT * FROM location_cities WHERE district_id = $1 ORDER BY name ASC",
      [district_id]
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    console.error("fetchCoreGeographyCities Error:", err);
    res.status(500).json({ error: "Failed to fetch geography cities master." });
  }
});

router.get("/geography/villages", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taluk_id } = req.query;
    if (!taluk_id) return res.status(400).json({ error: "taluk_id query parameter required." });
    const db = getPool();
    const result = await db.query(
      "SELECT * FROM location_villages WHERE taluk_id = $1 ORDER BY name ASC",
      [taluk_id]
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    console.error("fetchCoreGeographyVillages Error:", err);
    res.status(500).json({ error: "Failed to fetch geography villages master." });
  }
});

router.get("/geography/pincodes", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { city_id, village_id } = req.query;
    const db = getPool();
    let queryStr = "SELECT * FROM location_pincodes WHERE is_active = true";
    const params: any[] = [];
    
    if (city_id) {
      params.push(city_id);
      queryStr += ` AND city_id = $${params.length}`;
    }
    if (village_id) {
      params.push(village_id);
      queryStr += ` AND village_id = $${params.length}`;
    }
    
    queryStr += " ORDER BY pincode ASC";
    const result = await db.query(queryStr, params);
    res.json({ data: result.rows });
  } catch (err: any) {
    console.error("fetchCoreGeographyPincodes Error:", err);
    res.status(500).json({ error: "Failed to fetch geography pincodes master." });
  }
});

// ==========================================
// CORE MASTERS OPERATIONS
// ==========================================

// List distinct types of core masters available
router.get("/types", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getPool();
    const result = await db.query("SELECT DISTINCT master_type FROM core_masters ORDER BY master_type ASC");
    res.json({ data: result.rows.map((r: any) => r.master_type) });
  } catch (err: any) {
    console.error("fetchCoreMasterTypes Error:", err);
    res.status(500).json({ error: "Failed to fetch master types list." });
  }
});

// List all master records or filtered by master_type
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { type, status, include_inactive } = req.query;
    const db = getPool();

    let query = `
      SELECT * FROM core_masters 
      WHERE deleted_at IS NULL
    `;
    const params: any[] = [];

    // Return platform records OR records specific to this tenant
    if (tenantId) {
      params.push(tenantId);
      query += ` AND (is_platform_scope = true OR tenant_id = $${params.length})`;
    } else {
      query += ` AND is_platform_scope = true`;
    }

    if (type) {
      params.push(type);
      query += ` AND master_type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    } else if (include_inactive !== "true") {
      query += ` AND status = 'ACTIVE'`;
    }

    query += " ORDER BY master_type ASC, sort_order ASC, name ASC";

    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (err: any) {
    console.error("fetchCoreMasters Error:", err);
    res.status(500).json({ error: "Failed to fetch core masters." });
  }
});

// Get a specific core master record by UUID
router.get("/:uuid", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const tenantId = req.user?.tenantId;
    const db = getPool();

    let query = `
      SELECT * FROM core_masters 
      WHERE uuid = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [uuid];

    if (tenantId) {
      params.push(tenantId);
      query += ` AND (is_platform_scope = true OR tenant_id = $${params.length})`;
    } else {
      query += ` AND is_platform_scope = true`;
    }

    const result = await db.query(query, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Core master record not found or unauthorized access." });
    }

    res.json({ data: result.rows[0] });
  } catch (err: any) {
    console.error("getCoreMaster Error:", err);
    res.status(500).json({ error: "Failed to fetch core master detail." });
  }
});

// Create a new core master record
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { master_type, code, name, description, status, sort_order, is_platform_scope } = req.body;

    if (!master_type || !code || !name) {
      return res.status(400).json({ error: "master_type, code, and name are required fields." });
    }

    const db = getPool();
    const final_tenant_id = is_platform_scope === true ? null : (tenantId || null);
    const final_platform_scope = is_platform_scope === undefined ? true : !!is_platform_scope;

    const result = await db.query(`
      INSERT INTO core_masters (
        master_type, code, name, description, status, sort_order, tenant_id, is_platform_scope, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      master_type.trim().toUpperCase(),
      code.trim().toUpperCase(),
      name.trim(),
      description || null,
      status || "ACTIVE",
      sort_order || 0,
      final_tenant_id,
      final_platform_scope,
      userId || null,
      userId || null
    ]);

    res.status(201).json({ data: result.rows[0] });
  } catch (err: any) {
    console.error("createCoreMaster Error:", err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Duplicate code! This master code already exists for this scope." });
    }
    res.status(500).json({ error: "Failed to create core master record." });
  }
});

// Update a core master record by UUID
router.put("/:uuid", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { name, description, status, sort_order, is_platform_scope } = req.body;

    const db = getPool();

    // Verify ownership/scope before update
    let checkQuery = `
      SELECT * FROM core_masters WHERE uuid = $1 AND deleted_at IS NULL
    `;
    const checkParams: any[] = [uuid];
    if (tenantId) {
      checkParams.push(tenantId);
      checkQuery += ` AND (is_platform_scope = true OR tenant_id = $2)`;
    } else {
      checkQuery += ` AND is_platform_scope = true`;
    }

    const checkRes = await db.query(checkQuery, checkParams);
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: "Core master record not found or unauthorized access." });
    }

    const currentRecord = checkRes.rows[0];

    const final_name = name !== undefined ? name.trim() : currentRecord.name;
    const final_desc = description !== undefined ? description : currentRecord.description;
    const final_status = status !== undefined ? status : currentRecord.status;
    const final_sort = sort_order !== undefined ? parseInt(sort_order, 10) : currentRecord.sort_order;
    const final_platform = is_platform_scope !== undefined ? !!is_platform_scope : currentRecord.is_platform_scope;
    const final_tenant = final_platform ? null : (tenantId || currentRecord.tenant_id);

    const updateRes = await db.query(`
      UPDATE core_masters 
      SET name = $1, description = $2, status = $3, sort_order = $4, is_platform_scope = $5, tenant_id = $6, updated_by = $7, updated_at = CURRENT_TIMESTAMP
      WHERE uuid = $8 AND deleted_at IS NULL
      RETURNING *
    `, [
      final_name,
      final_desc,
      final_status,
      final_sort,
      final_platform,
      final_tenant,
      userId || null,
      uuid
    ]);

    res.json({ data: updateRes.rows[0] });
  } catch (err: any) {
    console.error("updateCoreMaster Error:", err);
    res.status(500).json({ error: "Failed to update core master record." });
  }
});

// Soft delete a core master record by UUID
router.delete("/:uuid", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const db = getPool();

    // Verify ownership/scope before delete
    let checkQuery = `
      SELECT * FROM core_masters WHERE uuid = $1 AND deleted_at IS NULL
    `;
    const checkParams: any[] = [uuid];
    if (tenantId) {
      checkParams.push(tenantId);
      checkQuery += ` AND (is_platform_scope = true OR tenant_id = $2)`;
    } else {
      checkQuery += ` AND is_platform_scope = true`;
    }

    const checkRes = await db.query(checkQuery, checkParams);
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: "Core master record not found or unauthorized access." });
    }

    await db.query(`
      UPDATE core_masters 
      SET deleted_at = CURRENT_TIMESTAMP, updated_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE uuid = $2
    `, [userId || null, uuid]);

    res.json({ success: true, message: "Core master record deleted successfully." });
  } catch (err: any) {
    console.error("deleteCoreMaster Error:", err);
    res.status(500).json({ error: "Failed to delete core master record." });
  }
});

export default router;
