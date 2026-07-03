import { useMemo, useState } from "react";

const DAYS = 14;
const WIDTH = 640;
const HEIGHT = 180;
const PAD_LEFT = 28;
const PAD_BOTTOM = 20;
const PAD_TOP = 10;

function lastNDays(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// Bar chart of new listings found per day over the trailing 14 days.
// Single hue (sequential/magnitude) - this is one series, so no legend;
// axis labels are direct instead.
export function TrendChart({ listings }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const { days, counts, maxCount } = useMemo(() => {
    const days = lastNDays(DAYS);
    const byDay = Object.fromEntries(days.map((d) => [d, 0]));
    for (const l of listings) {
      if (!l.firstSeenAt) continue;
      const key = new Date(l.firstSeenAt).toISOString().slice(0, 10);
      if (key in byDay) byDay[key] += 1;
    }
    const counts = days.map((d) => byDay[d]);
    return { days, counts, maxCount: Math.max(1, ...counts) };
  }, [listings]);

  const plotW = WIDTH - PAD_LEFT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const barGap = 4;
  const barWidth = plotW / DAYS - barGap;
  const gridSteps = 4;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="New listings found per day, last 14 days">
        {Array.from({ length: gridSteps + 1 }).map((_, i) => {
          const y = PAD_TOP + (plotH / gridSteps) * i;
          return (
            <line
              key={i}
              x1={PAD_LEFT}
              x2={WIDTH}
              y1={y}
              y2={y}
              stroke="var(--gridline)"
              strokeWidth="1"
            />
          );
        })}
        {[0, maxCount].map((v, i) => (
          <text
            key={i}
            x={PAD_LEFT - 6}
            y={PAD_TOP + plotH - (v / maxCount) * plotH + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--text-muted)"
          >
            {v}
          </text>
        ))}
        {counts.map((count, i) => {
          const barH = (count / maxCount) * plotH;
          const x = PAD_LEFT + i * (barWidth + barGap);
          const y = PAD_TOP + plotH - barH;
          const isHover = hoverIdx === i;
          return (
            <g key={i}>
              <rect
                x={x}
                y={barH === 0 ? y - 2 : y}
                width={Math.max(barWidth, 1)}
                height={Math.max(barH, barH === 0 ? 2 : barH)}
                rx={3}
                fill={isHover ? "var(--series-1)" : "var(--series-1)"}
                opacity={isHover ? 1 : 0.85}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
              {i % 2 === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={HEIGHT - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--text-muted)"
                >
                  {days[i].slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hoverIdx !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((PAD_LEFT + hoverIdx * (barWidth + barGap) + barWidth / 2) / WIDTH) * 100}%`,
            top: `${((PAD_TOP + plotH - (counts[hoverIdx] / maxCount) * plotH) / HEIGHT) * 100}%`,
          }}
        >
          {days[hoverIdx]}: {counts[hoverIdx]} new
        </div>
      )}
    </div>
  );
}
