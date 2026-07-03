import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../auth.js";

export const listingsRouter = Router();

function toApi(row) {
  return {
    id: row.id,
    itemId: row.item_id,
    title: row.title,
    url: row.url,
    price: row.price_value != null ? { value: Number(row.price_value), currency: row.price_currency } : null,
    imageUrl: row.image_url,
    sellerUsername: row.seller_username,
    condition: row.condition,
    marketplace: row.marketplace,
    matchedKeyword: row.matched_keyword,
    riskScore: row.risk_score,
    riskReasons: row.risk_reasons || [],
    status: row.status,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  };
}

listingsRouter.use(requireAuth);

listingsRouter.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM listings ORDER BY first_seen_at DESC");
  res.json(rows.map(toApi));
});

listingsRouter.get("/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM listings WHERE id = $1", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Listing not found." });
  res.json(toApi(rows[0]));
});

const ALLOWED_STATUSES = ["new", "authorized", "dismissed", "report_prepared", "reported"];

listingsRouter.patch("/:id", async (req, res) => {
  const { status } = req.body || {};
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${ALLOWED_STATUSES.join(", ")}` });
  }
  const { rows } = await pool.query(
      "UPDATE listings SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id],
  );
  if (rows.length === 0) return res.status(404).json({ error: "Listing not found." });
  res.json(toApi(rows[0]));
});
