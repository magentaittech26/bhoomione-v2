import pg from "pg";

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

export function getPoolConfig() {
  const host = process.env.SQL_HOST;
  const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER;
  const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD;
  const database = process.env.SQL_DB_NAME;
  const port = process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432;

  return {
    host,
    user,
    password,
    database,
    port,
  };
}

export function getPool(): pg.Pool {
  if (poolInstance) {
    return poolInstance;
  }

  const config = getPoolConfig();

  if (!config.host || !config.database) {
    console.warn(
      "⚠️ Database connection variables (SQL_HOST, SQL_DB_NAME) are missing. Ready to connect once variables are provided."
    );
  }

  poolInstance = new Pool({
    host: config.host || "127.0.0.1",
    user: config.user || "postgres",
    password: config.password || "postgres",
    database: config.database || "bhoomione",
    port: config.port,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10,
  });

  poolInstance.on("error", (err) => {
    console.error("Unexpected error on idle PostgreSQL client", err);
  });

  return poolInstance;
}

export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  const pool = getPool();
  try {
    const client = await pool.connect();
    client.release();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}
