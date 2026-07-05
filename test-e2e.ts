import { getPool } from "./server/db/pool.ts";
import { JwtTokenService } from "./server/services/jwt.ts";

async function runE2ETest() {
  console.log("🚀 Starting End-to-End CAD-to-Interactive-Map Workflow Audit...");

  const db = getPool();

  // 1. Resolve User & Context
  const userRes = await db.query(`
    SELECT u.*, r.code as role, tu.tenant_id 
    FROM users u
    JOIN tenant_users tu ON u.id = tu.user_id
    JOIN roles r ON tu.role_id = r.id
    WHERE u.email = 'owner@developer1.com'
    LIMIT 1
  `);

  if (userRes.rowCount === 0) {
    throw new Error("No user found in database to generate auth context.");
  }

  const user = userRes.rows[0];
  console.log(`👤 Auth Context: User ${user.email} (Tenant: ${user.tenant_id}, Role: ${user.role})`);

  // Sign verification JWT token
  const token = JwtTokenService.generateAccessToken({
    userId: user.id,
    email: user.email,
    name: `${user.first_name} ${user.last_name}`,
    role: user.role,
    tenantId: user.tenant_id
  });

  const headers = {
    "Authorization": `Bearer ${token}`
  };

  // 2. Fetch seeded Project & Layout
  const projRes = await db.query(`SELECT * FROM projects WHERE tenant_id = $1 LIMIT 1`, [user.tenant_id]);
  const layRes = await db.query(`SELECT * FROM layouts WHERE project_id = $1 LIMIT 1`, [projRes.rows[0].id]);

  const projectId = projRes.rows[0].id;
  const layoutId = layRes.rows[0].id;

  console.log(`📂 Target Scope: Project "${projRes.rows[0].name}" (${projectId})`);
  console.log(`🗺️ Target Layout: Layout "${layRes.rows[0].name}" (${layoutId})`);

  // 3. Create mock DXF file content for upload
  const dxfContent = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LTYPE
0
ENDTAB
0
TABLE
2
LAYER
0
LAYER
70
64
2
PLOT_NO
62
7
61
0
0
LAYER
70
64
2
ROAD_9M
62
1
61
0
0
LAYER
70
64
2
PARK_AMENITY
62
3
61
0
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
POLYLINE
8
PLOT_NO
66
1
0
VERTEX
8
PLOT_NO
10
10.0
20.0
0
VERTEX
8
PLOT_NO
10
50.0
20.0
0
VERTEX
8
PLOT_NO
10
50.0
60.0
0
VERTEX
8
PLOT_NO
10
10.0
60.0
0
SEQEND
8
PLOT_NO
0
ENDSEC
0
EOF`;

  console.log("⬆️ Uploading simulated DXF file...");

  // Build Multipart Form Data request
  const boundary = "----WebKitFormBoundaryE2ECADImportTest";
  const bodyParts: string[] = [];

  bodyParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="project_id"\r\n\r\n${projectId}\r\n`);
  bodyParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="layout_id"\r\n\r\n${layoutId}\r\n`);
  bodyParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="dxf_file"; filename="township_layout_e2e_test.dxf"\r\nContent-Type: application/octet-stream\r\n\r\n${dxfContent}\r\n`);
  bodyParts.push(`--${boundary}--\r\n`);

  const formBody = bodyParts.join("");

  const uploadRes = await fetch("http://localhost:3000/api/v1/dxf/upload", {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    },
    body: formBody
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Upload failed with status ${uploadRes.status}: ${errorText}`);
  }

  const uploadData = await uploadRes.json() as any;
  console.log("✅ CAD Upload Successful!");
  console.log(`   - File ID: ${uploadData.dxf_file_id}`);
  console.log(`   - Import Job ID: ${uploadData.import_job_id}`);
  console.log(`   - Layers Detected: ${uploadData.total_layers}`);
  console.log(`   - Elements Evaluated: ${uploadData.total_entities}`);
  console.log(`   - Storage Version: v${uploadData.version}`);

  const fileId = uploadData.dxf_file_id;
  const jobId = uploadData.import_job_id;

  // 4. Verify Layer Extraction & Metadata Heuristics
  console.log("\n📊 Verifying Layer Extraction & Metadata Persistence...");
  const jobStatusRes = await fetch(`http://localhost:3000/api/v1/dxf/jobs/${jobId}`, {
    method: "GET",
    headers
  });

  if (!jobStatusRes.ok) {
    throw new Error(`Failed to query import job: ${jobStatusRes.status}`);
  }

  const jobDetails = await jobStatusRes.json() as any;
  console.log(`   - Job Parsing Status: ${jobDetails.status}`);
  console.log("   - Discovered Layers & Confidence Scores:");
  const layers = jobDetails.extracted_metadata?.layers || [];
  layers.forEach((l: any) => {
    console.log(`     ▪ Layer: [${l.layer_name}] -> Objects: ${l.object_count}, System Suggested: ${l.suggested_type} (Score: ${l.confidence_score})`);
  });

  // 5. Submit Custom Mapping Layer Updates
  console.log("\n💾 Saving Classification Layer Mappings...");
  const mappingPayload = layers.map((l: any) => ({
    layer_name: l.layer_name,
    layer_type: l.suggested_type || "IGNORE"
  }));

  const mappingsSaveRes = await fetch(`http://localhost:3000/api/v1/dxf/mappings`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      dxf_file_id: fileId,
      mappings: mappingPayload
    })
  });

  if (!mappingsSaveRes.ok) {
    const errText = await mappingsSaveRes.text();
    throw new Error(`Failed to save mappings: ${errText}`);
  }

  console.log("✅ Layer mappings successfully committed to DXF file profile!");

  // 6. Trigger CAD-to-SVG Processing and Compilation
  console.log("\n⚙️ Processing layer configurations and compiling SVG maps...");
  const processRes = await fetch("http://localhost:3000/api/v1/dxf/process", {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      dxf_file_id: fileId
    })
  });

  if (!processRes.ok) {
    const errText = await processRes.text();
    throw new Error(`Compilation pipeline failed: ${errText}`);
  }

  const processData = await processRes.json() as any;
  console.log("✅ SVG compilation and viewport optimization complete!");
  console.log(`   - Message: ${processData.message}`);

  // 7. Check if Layout has been APPROVED and Plots generated
  console.log("\n🔍 Verifying state updates on Layout & Plots...");
  const updatedLayoutRes = await db.query(`SELECT status FROM layouts WHERE id = $1`, [layoutId]);
  const plotCountRes = await db.query(`SELECT COUNT(*) FROM plots WHERE layout_id = $1`, [layoutId]);

  console.log(`   - Layout Status (Expected: APPROVED): ${updatedLayoutRes.rows[0].status}`);
  console.log(`   - Associated Plots in Inventory: ${plotCountRes.rows[0].count}`);

  if (updatedLayoutRes.rows[0].status !== "APPROVED") {
    throw new Error("Validation Error: Layout was not successfully approved after CAD compilation.");
  }

  // 8. Verify Interactive Map Vector Retrieval
  console.log("\n🎨 Simulating Interactive Map Load for Layout...");
  const svgDocRes = await fetch(`http://localhost:3000/api/v1/dxf/svg-documents/${layoutId}`, {
    method: "GET",
    headers
  });

  if (!svgDocRes.ok) {
    const errText = await svgDocRes.text();
    throw new Error(`Failed to load SVG document: ${errText}`);
  }

  const svgDocData = await svgDocRes.json() as any;
  if (!svgDocData.success || !svgDocData.data) {
    throw new Error("Interactive Layout Viewer failed to retrieve compiled vector payload.");
  }

  const doc = svgDocData.data;
  console.log("✅ Interactive Layout Viewer fetched compiled vector payload successfully!");
  console.log(`   - SVG Document ID: ${doc.id}`);
  console.log(`   - Canvas Dimensions: ${doc.width}x${doc.height}`);
  console.log(`   - SVG ViewBox: ${doc.viewbox}`);
  console.log(`   - Render Profile: ${doc.render_profile} (v${doc.version})`);
  console.log(`   - Vector Elements Committed: ${doc.elements.length}`);
  console.log(`   - Plot Text Labels: ${doc.labels.length}`);
  console.log(`   - Style Profiles Available: ${doc.style_profiles.length}`);

  console.log("\n==================================================");
  console.log("🎉 BHOOMIONE V3.1 CAD-TO-MAP CORE WORKFLOW: 100% SUCCESS!");
  console.log("==================================================");
  
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error("\n❌ E2E CAD-to-Map Audit Failed:", err);
  process.exit(1);
});
