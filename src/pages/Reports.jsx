import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { subscribeReports, markReportSubmitted } from "../services/firestore";

export function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const unsub = subscribeReports((rows) => {
      setReports(rows);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>VeRO reports</h1>
          <p>Reports prepared for eBay's VeRO takedown process. Submission is manual by design - see README.</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            No reports prepared yet. Flag a listing and click "Prepare VeRO report" from its
            detail page.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <Fragment key={r.id}>
                  <tr onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                    <td>{r.listingSnapshot?.title || r.itemId}</td>
                    <td>
                      <span className="badge">
                        <span
                          className="badge-dot"
                          style={{
                            background:
                              r.status === "submitted" ? "var(--status-good)" : "var(--status-warning)",
                          }}
                        />
                        {r.status === "submitted" ? "Submitted" : "Draft"}
                      </span>
                    </td>
                    <td>{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : "-"}</td>
                    <td>
                      <Link to={`/listings/${r.listingId}`} onClick={(e) => e.stopPropagation()}>
                        View listing →
                      </Link>
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr>
                      <td colSpan={4}>
                        <pre className="report-text">{r.reportText}</pre>
                        {r.status !== "submitted" && (
                          <button
                            className="btn btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              markReportSubmitted(r.id);
                            }}
                          >
                            Mark as submitted
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
