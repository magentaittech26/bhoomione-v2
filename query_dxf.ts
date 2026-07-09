import { getPool } from "./server/db/pool.ts";

async function main() {
  const pool = getPool();
  try {
    const dxfFiles = await pool.query("SELECT * FROM dxf_files");
    console.log("dxf_files count:", dxfFiles.rowCount);
    console.log(JSON.stringify(dxfFiles.rows, null, 2));

    const importJobs = await pool.query("SELECT * FROM import_jobs");
    console.log("import_jobs count:", importJobs.rowCount);
    console.log(JSON.stringify(importJobs.rows, null, 2));

    const importJobLogs = await pool.query("SELECT * FROM import_job_logs ORDER BY created_at DESC LIMIT 20");
    console.log("import_job_logs limit 20:");
    console.log(JSON.stringify(importJobLogs.rows, null, 2));

  } catch (err: any) {
    console.error("DB failed:", err.message);
  } finally {
    await pool.end();
  }
}

main();
