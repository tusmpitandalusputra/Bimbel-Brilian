import React, { useState } from 'react';
import { ProgressRecord } from '../types';

interface ProgressChartProps {
  records: ProgressRecord[];
  height?: number;
  emptyLabel?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  records,
  height = 220,
  emptyLabel = 'Belum ada riwayat nilai untuk ditampilkan pada grafik.',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-sm text-slate-500"
        style={{ minHeight: height }}
      >
        {emptyLabel}
      </div>
    );
  }

  const width = 640;
  const padLeft = 40;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 36;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const points = sorted.map((rec, i) => {
    const x =
      sorted.length === 1
        ? padLeft + plotW / 2
        : padLeft + (i / (sorted.length - 1)) * plotW;
    const clampedScore = Math.max(0, Math.min(100, rec.score));
    const y = padTop + ((100 - clampedScore) / 100) * plotH;
    return { x, y, rec };
  });

  const linePath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const yTicks = [0, 25, 50, 75, 100];
  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Grafik perkembangan nilai siswa"
      >
        <defs>
          <linearGradient id="cendekiaScoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = padTop + ((100 - tick) / 100) * plotH;
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={tick === 75 ? '4 4' : undefined}
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 font-mono text-[11px] tabular-nums"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#cendekiaScoreFill)" />}

        {points.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((pt, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g
              key={pt.rec.id || idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 5.5 : 4}
                fill="#ffffff"
                stroke="#1e3a8a"
                strokeWidth={isHovered ? 3 : 2.25}
              />
              <text
                x={pt.x}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[10px] tabular-nums"
              >
                {pt.rec.date.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 right-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
        >
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono tabular-nums">{hovered.rec.date}</span>
            <span aria-hidden="true">·</span>
            <span>{hovered.rec.subject}</span>
          </div>
          <div className="mt-0.5 text-xs font-medium text-slate-800">
            {hovered.rec.topic}
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-indigo-900 tabular-nums">
            Skor {hovered.rec.score}/100 ({hovered.rec.mastery})
          </div>
        </div>
      )}
    </div>
  );
};
