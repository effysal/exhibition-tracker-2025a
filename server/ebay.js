const PAGE_LIMIT = 200;
const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";

// Cached in the process between invocations - avoids one OAuth round trip
// per search within the same scan run.
let cachedToken = null;

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID / EBAY_CLIENT_SECRET are not configured");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }),
  });

  if (!res.ok) {
    throw new Error(`eBay OAuth token request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

/**
 * Searches eBay's Browse API for a keyword in a given marketplace, paginating
 * up to `maxPages` pages of `PAGE_LIMIT` results each.
 */
export async function searchListings({ keyword, marketplaceId, maxPages = 3 }) {
  const token = await getAccessToken();
  const results = [];
  let offset = 0;

  for (let page = 0; page < maxPages; page++) {
    const url = new URL(SEARCH_URL);
    url.searchParams.set("q", keyword);
    url.searchParams.set("limit", String(PAGE_LIMIT));
    url.searchParams.set("offset", String(offset));

    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
      },
    });

    if (!res.ok) {
      throw new Error(
          `eBay search failed for "${keyword}" (${marketplaceId}): ${res.status} ${await res.text()}`,
      );
    }

    const data = await res.json();
    const items = data.itemSummaries || [];
    results.push(...items);

    offset += PAGE_LIMIT;
    if (offset >= (data.total || 0) || items.length === 0) break;
  }

  return results;
}
