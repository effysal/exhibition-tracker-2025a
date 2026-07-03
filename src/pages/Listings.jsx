import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeListings } from "../services/firestore";
import { RiskBadge, StatusBadge } from "../components/RiskBadge";

const STATUS_FILTERS = [
  { value: "active", label: "Active (needs review)" },
  { value: "new", label: "New" },
  { value: "report_prepared", label: "Report prepared" },
  { value: "reported", label: "Reported" },
  { value: "authorized", label: "Authorized reseller" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

export function Listings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeListings((rows) => {
      setListings(rows);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    let rows = listings;
    if (statusFilter === "active") {
      rows = rows.filter((l) => l.status !== "dismissed" && l.status !== "authorized");
    } else if (statusFilter !== "all") {
      rows = rows.filter((l) => l.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (l) =>
          l.title?.toLowerCase().includes(q) || l.sellerUsername?.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [listings, statusFilter, search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Listings</h1>
          <p>{filtered.length} of {listings.length} listings shown</p>
        </div>
      </div>

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search title or seller..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 240 }}
        />
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No listings match this filter.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Risk</th>
                <th>Status</th>
                <th>First seen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} onClick={() => navigate(`/listings/${l.id}`)}>
                  <td>{l.title}</td>
                  <td>{l.sellerUsername}</td>
                  <td>{l.price ? `${l.price.currency} ${l.price.value}` : "-"}</td>
                  <td>
                    <RiskBadge score={l.riskScore} />
                  </td>
                  <td>
                    <StatusBadge status={l.status} />
                  </td>
                  <td>
                    {l.firstSeenAt?.toDate ? l.firstSeenAt.toDate().toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
