import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import authRouter from "./server/routes/auth.ts";
import inventoryRouter from "./server/routes/inventory.ts";
import saasRouter from "./server/routes/saas.ts";
import { bootstrapDatabase } from "./server/db/bootstrap.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Bootstrap the real PostgreSQL databases schemas asynchronously
  bootstrapDatabase().catch((err) => {
    console.error("⚠️ Database bootstrap step failed during server boot:", err);
  });

  // Mount API paths under v1 prefix
  app.use("/api/v1", authRouter);
  app.use("/api/v1", inventoryRouter);
  app.use("/api/v1", saasRouter);

  // Integrate Vite dev middleware or production asset files
  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Mounting Vite development middleware wrapper...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Running in PRODUCTION mode, serving static bundles from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`==================================================================`);
    console.log(` BhoomiOne V2 Backend - Sprint 1B Auth Services is live!`);
    console.log(` API Endpoint: http://0.0.0.0:${PORT}`);
    console.log(` Environment:  ${process.env.NODE_ENV || "development"}`);
    console.log(`==================================================================`);
  });
}

startServer();
