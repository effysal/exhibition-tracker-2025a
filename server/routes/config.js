import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../auth.js";

export const configRouter = Router();

function toApi(row) {
  return {
    keywords: row.keywords || [],
    marketplaces: row.marketplaces || [],
    authorizedSellers: row.authorized_sellers || [],
    typicalPrice: row.typical_price != null ? Number(row.typical_price) : null,
    veroPortalUrl: row.vero_portal_url || "",
    trademark: {
      ownerName: row.trademark_owner_name || "",
      registrationNumber: row.trademark_registration_number || "",
      registrationCountry: row.trademark_registration_country || "",
      contactName: row.trademark_contact_name || "",
      contactEmail: row.trademark_contact_email || "",
    },
  };
}

configRouter.use(requireAuth);

configRouter.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM brand_config WHERE id = 1");
  res.json(toApi(rows[0] || {}));
});

configRouter.put("/", async (req, res) => {
  const body = req.body || {};
  const trademark = body.trademark || {};

  const { rows } = await pool.query(
      `UPDATE brand_config SET
        keywords = $1,
        marketplaces = $2,
        authorized_sellers = $3,
        typical_price = $4,
        vero_portal_url = $5,
        trademark_owner_name = $6,
        trademark_registration_number = $7,
        trademark_registration_country = $8,
        trademark_contact_name = $9,
        trademark_contact_email = $10
       WHERE id = 1 RETURNING *`,
      [
        body.keywords || [],
        body.marketplaces || [],
        body.authorizedSellers || [],
        body.typicalPrice || null,
        body.veroPortalUrl || null,
        trademark.ownerName || null,
        trademark.registrationNumber || null,
        trademark.registrationCountry || null,
        trademark.contactName || null,
        trademark.contactEmail || null,
      ],
  );
  res.json(toApi(rows[0]));
});
