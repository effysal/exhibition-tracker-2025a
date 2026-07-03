const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

const {EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, searchListings} = require("./ebay");
const {scoreListing} = require("./detection");

initializeApp();

const DEFAULT_CONFIG = {
  keywords: ["Opatra", "Opatra London"],
  marketplaces: ["EBAY_GB"],
  authorizedSellers: [],
  typicalPrice: null,
};

async function loadBrandConfig() {
  const snap = await getFirestore().collection("config").doc("brand").get();
  if (!snap.exists) return DEFAULT_CONFIG;
  return {...DEFAULT_CONFIG, ...snap.data()};
}

async function runScan() {
  const db = getFirestore();
  const {keywords, marketplaces, authorizedSellers, typicalPrice} = await loadBrandConfig();

  let scanned = 0;
  let flaggedNew = 0;

  for (const marketplaceId of marketplaces) {
    for (const keyword of keywords) {
      let items;
      try {
        items = await searchListings({keyword, marketplaceId});
      } catch (err) {
        logger.error(`eBay search failed for "${keyword}" / ${marketplaceId}`, err);
        continue;
      }

      for (const item of items) {
        if (!item.itemId) continue;
        scanned++;

        const {score, reasons, autoStatus} = scoreListing(item, {
          keyword, authorizedSellers, typicalPrice,
        });

        const docId = item.itemId.replace(/[/]/g, "_");
        const ref = db.collection("listings").doc(docId);
        const existing = await ref.get();
        const now = FieldValue.serverTimestamp();

        const payload = {
          itemId: item.itemId,
          title: item.title || "(untitled listing)",
          url: item.itemWebUrl || null,
          price: item.price ?
            {value: Number(item.price.value), currency: item.price.currency} :
            null,
          imageUrl: (item.image && item.image.imageUrl) || null,
          sellerUsername: (item.seller && item.seller.username) || "unknown",
          condition: item.condition || null,
          marketplace: marketplaceId,
          matchedKeyword: keyword,
          riskScore: score,
          riskReasons: reasons,
          lastSeenAt: now,
        };

        if (!existing.exists) {
          payload.firstSeenAt = now;
          payload.status = autoStatus || "new";
          if (!autoStatus) flaggedNew++;
          await ref.set(payload);
        } else {
          // Never clobber a human decision (dismissed / authorized /
          // report_prepared / reported) - only auto-advance listings that
          // are still sitting at "new".
          const prevStatus = existing.data().status;
          const nextStatus = prevStatus === "new" && autoStatus ? autoStatus : prevStatus;
          await ref.set({...payload, status: nextStatus}, {merge: true});
        }
      }
    }
  }

  logger.info(`VeRO scan complete: ${scanned} listings scanned, ${flaggedNew} newly flagged`);
  return {scanned, flaggedNew};
}

exports.scheduledEbayScan = onSchedule(
    {
      schedule: "every 6 hours",
      secrets: [EBAY_CLIENT_ID, EBAY_CLIENT_SECRET],
      timeoutSeconds: 540,
    },
    async () => {
      await runScan();
    },
);

exports.runEbayScanNow = onCall(
    {secrets: [EBAY_CLIENT_ID, EBAY_CLIENT_SECRET], timeoutSeconds: 540},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Sign in required.");
      }
      return runScan();
    },
);
