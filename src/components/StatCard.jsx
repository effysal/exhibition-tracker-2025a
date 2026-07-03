export function StatCard({ label, value, status }) {
  return (
    <div className="stat-tile" data-status={status}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
