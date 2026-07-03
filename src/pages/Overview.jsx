import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useFetch } from "../hooks/useFetch";
import { StatCard } from "../components/StatCard";
import { TrendChart } from "../components/TrendChart";
import { RiskBadge } from "../components/RiskBadge";

export function Overview() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useFetch(api.listListings);
  const listings = data || [];
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  useEffect(() => {
    const timer = setInterval(refetch, 60000);
    return () => clearInterval(timer);
  }, [refetch]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const active = listings.filter((l) => l.status !== "dismissed" && l.status !== "authorized");
    const newThisWeek = listings.filter((l) => new Date(l.firstSeenAt).getTime() >= weekAgo);
    const highRisk = active.filter((l) => l.riskScore >= 70);
    const reported = listings.filter((l) => l.status === "reported");
    return {
      active: active.length,
      newThisWeek: newThisWeek.length,
      highRisk: highRisk.length,
      reported: reported.length,
    };
  }, [listings]);

  const topRisk = useMemo(
    () =>
      [...listings]
        .filter((l) => l.status !== "dismissed" && l.status !== "authorized")
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 8),
    [listings],
  );

  async function runScanNow() {
    setScanning(true);
    setScanResult(null);
    setScanError(null);
    try {
      const result = await api.scanNow();
      setScanResult(result);
      await refetch();
    } catch (err) {
      setScanError(err.message || "Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>eBay listings using the Opatra trademark, scanned automatically every 6 hours.</p>
        </div>
        <button className="btn btn-primary" onClick={runScanNow} disabled={scanning}>
          {scanning ? "Scanning..." : "Scan eBay now"}
        </button>
      </div>

      {scanResult && (
        <div className="evidence-banner">
          Scan complete: {scanResult.scanned} listings checked, {scanResult.flaggedNew} newly flagged.
        </div>
      )}
      {scanError && <p className="error-text">{scanError}</p>}

      <div className="stat-grid">
        <StatCard label="Active flagged listings" value={loading ? "..." : stats.active} status="warning" />
        <StatCard label="New this week" value={loading ? "..." : stats.newThisWeek} />
        <StatCard label="High risk" value={loading ? "..." : stats.highRisk} status="critical" />
        <StatCard label="Reported to eBay" value={loading ? "..." : stats.reported} status="good" />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">New listings found (last 14 days)</div>
        <TrendChart listings={listings} />
      </div>

      <div className="card">
        <div className="section-title">Highest risk listings needing review</div>
        {topRisk.length === 0 ? (
          <div className="empty-state">Nothing flagged yet. Run a scan to get started.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Seller</th>
                <th>Risk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topRisk.map((l) => (
                <tr key={l.id} onClick={() => navigate(`/listings/${l.id}`)}>
                  <td>{l.title}</td>
                  <td>{l.sellerUsername}</td>
                  <td>
                    <RiskBadge score={l.riskScore} />
                  </td>
                  <td>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ marginTop: 12 }}>
          <Link to="/listings">View all listings →</Link>
        </p>
      </div>
    </div>
  );
}
