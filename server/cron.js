import cron from "node-cron";
import { runScan } from "./scan.js";

export function startScanSchedule() {
  // Every 6 hours, on the hour.
  cron.schedule("0 */6 * * *", () => {
    runScan().catch((err) => console.error("Scheduled scan failed:", err));
  });
  console.log("eBay scan scheduled: every 6 hours");
}
