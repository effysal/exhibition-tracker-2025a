import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  subscribeListing,
  updateListingStatus,
  subscribeBrandConfig,
  createReport,
} from "../services/firestore";
import { buildVeroReportText } from "../services/veroReport";
import { RiskBadge, StatusBadge } from "../components/RiskBadge";

export function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(undefined);
  const [brand, setBrand] = useState(null);
  const [reportText, setReportText] = useState(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeListing(id, setListing), [id]);
  useEffect(() => subscribeBrandConfig(setBrand), []);

  if (listing === undefined) return <div className="empty-state">Loading...</div>;
  if (listing === null) return <div className="empty-state">Listing not found.</div>;

  async function setStatus(status) {
    setBusy(true);
    try {
      await updateListingStatus(id, status);
    } finally {
      setBusy(false);
    }
  }

  async function generateReport() {
    const text = buildVeroReportText({ listing, brand });
    setReportText(text);
    await createReport({
      listingId: id,
      itemId: listing.itemId,
      listingSnapshot: {
        title: listing.title,
        url: listing.url,
        sellerUsername: listing.sellerUsername,
        imageUrl: listing.imageUrl,
      },
      reportText: text,
    });
    await updateListingStatus(id, "report_prepared");
  }

  async function markReported() {
    setBusy(true);
    try {
      await updateListingStatus(id, "reported");
    } finally {
      setBusy(false);
    }
  }

  async function copyReport() {
    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{listing.title}</h1>
          <p>
            Item {listing.itemId} · {listing.marketplace} · Seller {listing.sellerUsername}
          </p>
        </div>
        <button className="btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: "1 1 320px" }}>
          {listing.imageUrl && (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 12 }}
            />
          )}
          <p>
            <strong>Price:</strong>{" "}
            {listing.price ? `${listing.price.currency} ${listing.price.value}` : "n/a"}
          </p>
          <p>
            <strong>Condition:</strong> {listing.condition || "n/a"}
          </p>
          <p>
            <strong>Matched keyword:</strong> {listing.matchedKeyword}
          </p>
          <p>
            <RiskBadge score={listing.riskScore} /> <StatusBadge status={listing.status} />
          </p>
          <p>
            <a href={listing.url} target="_blank" rel="noreferrer">
              View listing on eBay ↗
            </a>
          </p>
        </div>

        <div className="card" style={{ flex: "2 1 420px" }}>
          <div className="section-title">Why this was flagged</div>
          <ul className="risk-reasons">
            {(listing.riskReasons || []).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>

          <div className="evidence-banner">
            Automated triage only - confirm this is genuinely unauthorized use of the Opatra
            trademark (not an authorized reseller, nominative fair use, or coincidental keyword
            match) before filing a VeRO report.
          </div>

          <div className="toolbar">
            <button className="btn" disabled={busy} onClick={() => setStatus("authorized")}>
              Mark as authorized reseller
            </button>
            <button className="btn" disabled={busy} onClick={() => setStatus("dismissed")}>
              Dismiss (not infringing)
            </button>
            <button
              className="btn btn-primary"
              disabled={busy || !!reportText || ["report_prepared", "reported"].includes(listing.status)}
              onClick={generateReport}
            >
              Prepare VeRO report
            </button>
          </div>

          {!reportText && ["report_prepared", "reported"].includes(listing.status) && (
            <p className="form-row hint">
              A report was already prepared for this listing - see it on the{" "}
              <Link to="/reports">Reports</Link> page.
            </p>
          )}

          {reportText && (
            <div>
              <div className="section-title">VeRO report draft</div>
              <pre className="report-text">{reportText}</pre>
              <div className="toolbar">
                <button className="btn" onClick={copyReport}>
                  {copied ? "Copied!" : "Copy report text"}
                </button>
                {brand?.veroPortalUrl && (
                  <a
                    className="btn"
                    href={brand.veroPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open eBay VeRO portal ↗
                  </a>
                )}
                <button className="btn btn-primary" disabled={busy} onClick={markReported}>
                  Mark as submitted to eBay
                </button>
              </div>
              <p className="form-row hint">
                Paste this into eBay's VeRO reporting tool (or your enrolled VeRO portal) and
                submit it yourself - review each report before sending. See{" "}
                <Link to="/settings">Settings</Link> to fill in trademark details used above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
