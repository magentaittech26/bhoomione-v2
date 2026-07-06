import pg from "pg";
const { Client } = pg;

async function main() {
  const client = new Client({
    host: process.env.SQL_HOST || "127.0.0.1",
    user: process.env.SQL_USER || process.env.SQL_ADMIN_USER || "postgres",
    password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || "postgres",
    database: process.env.SQL_DB_NAME || "bhoomione",
    port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
  });

  try {
    await client.connect();
    console.log("Connected to database successfully!");

    // Task 1: Counts
    const counts = {
      states: 0,
      districts: 0,
      taluks: 0,
      cities: 0,
      villages: 0,
      pincodes: 0,
    };

    try {
      const res = await client.query("SELECT COUNT(*) FROM location_states");
      counts.states = parseInt(res.rows[0].count, 10);
    } catch (e: any) { console.log("states table error:", e.message); }

    try {
      const res = await client.query("SELECT COUNT(*) FROM location_districts");
      counts.districts = parseInt(res.rows[0].count, 10);
    } catch (e: any) { console.log("districts table error:", e.message); }

    try {
      const res = await client.query("SELECT COUNT(*) FROM location_taluks");
      counts.taluks = parseInt(res.rows[0].count, 10);
    } catch (e: any) { console.log("taluks table error:", e.message); }

    try {
      const res = await client.query("SELECT COUNT(*) FROM location_cities");
      counts.cities = parseInt(res.rows[0].count, 10);
    } catch (e: any) { console.log("cities table error:", e.message); }

    try {
      const res = await client.query("SELECT COUNT(*) FROM location_villages");
      counts.villages = parseInt(res.rows[0].count, 10);
    } catch (e: any) { console.log("villages table error:", e.message); }

    try {
      const res = await client.query("SELECT COUNT(*) FROM location_pincodes");
      counts.pincodes = parseInt(res.rows[0].count, 10);
    } catch (e: any) { console.log("pincodes table error:", e.message); }

    console.log("=== TASK 1: DATABASE COUNTS ===");
    console.log(JSON.stringify(counts, null, 2));

    // Task 2: Verify Karnataka
    const kaRes = await client.query("SELECT id FROM location_states WHERE name = 'Karnataka' OR code = 'KA' LIMIT 1");
    if (kaRes.rows.length > 0) {
      const kaId = kaRes.rows[0].id;
      const kaDistricts = await client.query("SELECT id, name FROM location_districts WHERE state_id = $1", [kaId]);
      console.log("\n=== TASK 2: KARNATAKA DISTRICTS ===");
      console.log(`Number of districts: ${kaDistricts.rows.length}`);
      console.log("Districts:", kaDistricts.rows.map(r => r.name).join(", "));

      // Check Belagavi and Dharwad
      const belagavi = kaDistricts.rows.find(d => d.name.toLowerCase().includes("belagavi") || d.name.toLowerCase().includes("belgaum"));
      const dharwad = kaDistricts.rows.find(d => d.name.toLowerCase().includes("dharwad") || d.name.toLowerCase().includes("dharwar"));

      if (belagavi) {
        const belagaviTaluks = await client.query("SELECT name FROM location_taluks WHERE district_id = $1", [belagavi.id]);
        console.log("\n=== TASK 3: BELAGAVI TALUKS ===");
        console.log(`Taluks linked to Belagavi (${belagavi.name}):`, belagaviTaluks.rows.map(r => r.name).join(", "));
      } else {
        console.log("\n=== TASK 3: BELAGAVI NOT FOUND ===");
      }

      if (dharwad) {
        const dharwadTaluks = await client.query("SELECT name FROM location_taluks WHERE district_id = $1", [dharwad.id]);
        console.log("\n=== TASK 4: DHARWAD TALUKS ===");
        console.log(`Taluks linked to Dharwad (${dharwad.name}):`, dharwadTaluks.rows.map(r => r.name).join(", "));
      } else {
        console.log("\n=== TASK 4: DHARWAD NOT FOUND ===");
      }
    } else {
      console.log("\n=== KARNATAKA STATE NOT FOUND ===");
    }

  } catch (err: any) {
    console.error("Database query failed:", err.message);
  } finally {
    await client.end();
  }
}

main();
