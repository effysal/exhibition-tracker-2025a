function riskBand(score) {
  if (score >= 70) return { status: "critical", label: "High risk", color: "var(--status-critical)" };
  if (score >= 40) return { status: "serious", label: "Medium risk", color: "var(--status-serious)" };
  if (score >= 20) return { status: "warning", label: "Low risk", color: "var(--status-warning)" };
  return { status: "good", label: "Minimal", color: "var(--status-good)" };
}

export function RiskBadge({ score }) {
  const band = riskBand(score);
  return (
    <span className="badge" title={`Risk score ${score}/100`}>
      <span className="badge-dot" style={{ background: band.color }} />
      {band.label} ({score})
    </span>
  );
}

const STATUS_LABELS = {
  new: { label: "New", color: "var(--status-warning)" },
  authorized: { label: "Authorized reseller", color: "var(--status-good)" },
  dismissed: { label: "Dismissed", color: "var(--text-muted)" },
  report_prepared: { label: "Report prepared", color: "var(--series-1)" },
  reported: { label: "Reported to eBay", color: "var(--status-critical)" },
};

export function StatusBadge({ status }) {
  const info = STATUS_LABELS[status] || { label: status, color: "var(--text-muted)" };
  return (
    <span className="badge">
      <span className="badge-dot" style={{ background: info.color }} />
      {info.label}
    </span>
  );
}
