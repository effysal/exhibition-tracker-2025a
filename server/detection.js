// Heuristic risk scoring for a candidate listing. This is a triage aid, not a
// verdict - every flagged listing still needs a human to confirm infringement
// before anything is reported to eBay (see README).

export const HIGH_RISK_TERMS = [
  "replica", "fake", "copy", "dupe", "knockoff", "knock off", "aaa quality",
  "1:1", "mirror image", "inspired by", "compatible with", "generic",
  "unbranded", "not genuine", "imitation", "clone",
];

export const BULK_TERMS = ["job lot", "joblot", "wholesale", "bulk lot"];

export function scoreListing(item, { keyword, authorizedSellers = [], typicalPrice = null }) {
  const title = (item.title || "").toLowerCase();
  const sellerUsername = (item.seller && item.seller.username) || "unknown";
  const reasons = [`Matched brand keyword "${keyword}" in listing title/description`];

  if (authorizedSellers.includes(sellerUsername)) {
    return {
      score: 5,
      reasons: [`Seller "${sellerUsername}" is on the authorized reseller allowlist`],
      autoStatus: "authorized",
    };
  }

  let score = 20;

  for (const term of HIGH_RISK_TERMS) {
    if (title.includes(term)) {
      score += 25;
      reasons.push(`Title contains high-risk term "${term}"`);
    }
  }

  for (const term of BULK_TERMS) {
    if (title.includes(term)) {
      score += 15;
      reasons.push(`Title suggests bulk/wholesale reselling ("${term}")`);
    }
  }

  const price = item.price && Number(item.price.value);
  if (typicalPrice && price && price > 0 && price < typicalPrice * 0.4) {
    score += 20;
    reasons.push(
        `Price (${item.price.currency} ${price}) is far below typical retail (${typicalPrice})`,
    );
  }

  if (authorizedSellers.length > 0) {
    score += 15;
    reasons.push(`Seller "${sellerUsername}" is not on the authorized reseller allowlist`);
  } else {
    reasons.push("No authorized-seller allowlist configured yet - all sellers are currently flagged");
  }

  return { score: Math.min(score, 100), reasons, autoStatus: null };
}
