import { pool } from "./db.js";
import { searchListings } from "./ebay.js";
import { scoreListing } from "./detection.js";

async function loadBrandConfig() {
  const { rows } = await pool.query("SELECT * FROM brand_config WHERE id = 1");
  const row = rows[0] || {};
  return {
    keywords: row.keywords?.length ? row.keywords : ["Opatra", "Opatra London"],
    marketplaces: row.marketplaces?.length ? row.marketplaces : ["EBAY_GB"],
    authorizedSellers: row.authorized_sellers || [],
    typicalPrice: row.typical_price,
  };
}

const UPSERT_SQL = `
INSERT INTO listings (
  id, item_id, title, url, price_value, price_currency, image_url,
  seller_username, condition, marketplace, matched_keyword, risk_score,
  risk_reasons, status, first_seen_at, last_seen_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now(), now())
ON CONFLICT (id) DO UPDATE SET
  item_id = EXCLUDED.item_id,
  title = EXCLUDED.title,
  url = EXCLUDED.url,
  price_value = EXCLUDED.price_value,
  price_currency = EXCLUDED.price_currency,
  image_url = EXCLUDED.image_url,
  seller_username = EXCLUDED.seller_username,
  condition = EXCLUDED.condition,
  marketplace = EXCLUDED.marketplace,
  matched_keyword = EXCLUDED.matched_keyword,
  risk_score = EXCLUDED.risk_score,
  risk_reasons = EXCLUDED.risk_reasons,
  status = CASE WHEN listings.status = 'new' THEN EXCLUDED.status ELSE listings.status END,
  last_seen_at = now()
`;

export async function runScan() {
  const { keywords, marketplaces, authorizedSellers, typicalPrice } = await loadBrandConfig();

  let scanned = 0;
  let flaggedNew = 0;

  for (const marketplaceId of marketplaces) {
    for (const keyword of keywords) {
      let items;
      try {
        items = await searchListings({ keyword, marketplaceId });
      } catch (err) {
        console.error(`eBay search failed for "${keyword}" / ${marketplaceId}:`, err.message);
        continue;
      }

      for (const item of items) {
        if (!item.itemId) continue;
        scanned++;

        const { score, reasons, autoStatus } = scoreListing(item, {
          keyword, authorizedSellers, typicalPrice,
        });

        const existing = await pool.query("SELECT status FROM listings WHERE id = $1", [item.itemId]);
        if (existing.rows.length === 0 && !autoStatus) flaggedNew++;

        await pool.query(UPSERT_SQL, [
          item.itemId,
          item.itemId,
          item.title || "(untitled listing)",
          item.itemWebUrl || null,
          item.price ? Number(item.price.value) : null,
          item.price ? item.price.currency : null,
          (item.image && item.image.imageUrl) || null,
          (item.seller && item.seller.username) || "unknown",
          item.condition || null,
          marketplaceId,
          keyword,
          score,
          reasons,
          autoStatus || "new",
        ]);
      }
    }
  }

  console.log(`VeRO scan complete: ${scanned} listings scanned, ${flaggedNew} newly flagged`);
  return { scanned, flaggedNew };
}
