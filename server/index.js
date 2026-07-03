import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";

import { initSchema } from "./db.js";
import { requireAuth } from "./auth.js";
import { runScan } from "./scan.js";
import { startScanSchedule } from "./cron.js";
import { authRouter } from "./routes/auth.js";
import { listingsRouter } from "./routes/listings.js";
import { reportsRouter } from "./routes/reports.js";
import { configRouter } from "./routes/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/config", configRouter);

app.post("/api/scan", requireAuth, async (req, res, next) => {
  try {
    const result = await runScan();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.use(express.static(DIST_DIR));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 3000;

initSchema()
    .then(() => {
      app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
      startScanSchedule();
    })
    .catch((err) => {
      console.error("Failed to initialize database schema:", err);
      process.exit(1);
    });
