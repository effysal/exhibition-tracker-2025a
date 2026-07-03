import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../auth.js";

export const reportsRouter = Router();

function toApi(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    itemId: row.item_id,
    listingSnapshot: row.listing_snapshot,
    reportText: row.report_text,
    status: row.status,
    createdAt: row.created_at,
    submittedAt: row.submitted_at,
  };
}

reportsRouter.use(requireAuth);

reportsRouter.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM reports ORDER BY created_at DESC");
  res.json(rows.map(toApi));
});

reportsRouter.post("/", async (req, res) => {
  const { listingId, itemId, listingSnapshot, reportText } = req.body || {};
  if (!listingId || !reportText) {
    return res.status(400).json({ error: "listingId and reportText are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
        `INSERT INTO reports (listing_id, item_id, listing_snapshot, report_text, status)
         VALUES ($1, $2, $3, $4, 'draft') RETURNING *`,
        [listingId, itemId || null, listingSnapshot || null, reportText],
    );
    await client.query("UPDATE listings SET status = 'report_prepared' WHERE id = $1", [listingId]);
    await client.query("COMMIT");
    res.status(201).json(toApi(rows[0]));
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

reportsRouter.patch("/:id", async (req, res) => {
  const { status } = req.body || {};
  if (status !== "submitted") {
    return res.status(400).json({ error: "Only status='submitted' is supported." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
        `UPDATE reports SET status = 'submitted', submitted_at = now() WHERE id = $1 RETURNING *`,
        [req.params.id],
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Report not found." });
    }
    await client.query("UPDATE listings SET status = 'reported' WHERE id = $1", [rows[0].listing_id]);
    await client.query("COMMIT");
    res.json(toApi(rows[0]));
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});
