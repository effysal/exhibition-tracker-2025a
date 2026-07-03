// Builds the plain-text infringement report a human pastes into eBay's VeRO
// reporting portal / form for a given listing. We deliberately do not submit
// this anywhere automatically - see README for why.
export function buildVeroReportText({ listing, brand }) {
  const trademark = brand?.trademark || {};

  const lines = [
    "VeRO Notice of Claimed Infringement - Trademark",
    "",
    `Rights owner: ${trademark.ownerName || "[owner legal name]"}`,
    `Trademark: ${trademark.registrationNumber ? `Reg. No. ${trademark.registrationNumber}` : "[registration number]"}` +
      ` (${trademark.registrationCountry || "[registration country]"})`,
    `Contact: ${trademark.contactName || "[contact name]"} - ${trademark.contactEmail || "[contact email]"}`,
    "",
    "Listing under review:",
    `  Title: ${listing.title}`,
    `  Item number: ${listing.itemId}`,
    `  URL: ${listing.url}`,
    `  Seller: ${listing.sellerUsername}`,
    `  Marketplace: ${listing.marketplace}`,
    `  Price: ${listing.price ? `${listing.price.currency} ${listing.price.value}` : "n/a"}`,
    "",
    "Reason for report:",
    `  This listing uses our registered trademark ("${listing.matchedKeyword}") without authorization.`,
    "  Automated triage flags (context only, not a legal determination - reviewed by a human before filing):",
    ...(listing.riskReasons || []).map((r) => `    - ${r}`),
    "",
    "We request removal of this listing under eBay's VeRO (Verified Rights Owner) program.",
  ];

  return lines.join("\n");
}
