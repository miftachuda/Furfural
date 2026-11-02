import React, { useMemo } from 'react';
import type { TagDataResponse } from '../services/api';
import type { PlantParameter } from '../config/parameters';
import { format } from 'date-fns';
import { Gauge, Scale, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface TankLevelCardProps {
  data: TagDataResponse[];
  parameters?: PlantParameter[];
  selectedDate?: string;
}

const CONVERSION_FACTOR = 2.11; // 1% = 2.11 Ton

export const TankLevelCard: React.FC<TankLevelCardProps> = ({
  data,
  parameters = [],
  selectedDate,
}) => {
  // Find the parameter configuration if available
  const paramConfig = useMemo(() => {
    return (
      parameters.find(
        (p) =>
          p.tagNumber.toLowerCase() === '023li_019.pv' ||
          p.name.toLowerCase().includes('023v102a')
      ) || {
        tagNumber: '023LI_019.pv',
        name: 'Level 023V102A',
        limitLow: 20,
        limitHigh: 80,
        unit: '%',
      }
    );
  }, [parameters]);

  // Find the tag data response for 023LI_019.pv (case-insensitive)
  const tagData = useMemo(() => {
    if (!data || data.length === 0) return null;
    return (
      data.find(
        (d) =>
          d.TagName.toLowerCase() === '023li_019.pv' ||
          d.TagName.toLowerCase().includes('023li_019')
      ) || null
    );
  }, [data]);

  // Process samples: sort by timestamp and extract metrics
  const {
    currentLevel,
    currentTon,
    latestTime,
    minLevel,
    maxLevel,
    avgLevel,
    sampleCount,
    hasData,
  } = useMemo(() => {
    if (!tagData || !tagData.Samples || tagData.Samples.length === 0) {
      return {
        currentLevel: null,
        currentTon: null,
        latestTime: null,
        minLevel: null,
        maxLevel: null,
        avgLevel: null,
        sampleCount: 0,
        hasData: false,
      };
    }

    // Sort chronologically
    const sorted = [...tagData.Samples].sort((a, b) => {
      const timeA = new Date(a.TimeStamp).getTime();
      const timeB = new Date(b.TimeStamp).getTime();
      if (!isNaN(timeA) && !isNaN(timeB)) {
        return timeA - timeB;
      }
      return a.TimeStamp.localeCompare(b.TimeStamp);
    });

    const latest = sorted[sorted.length - 1];
    const values = sorted.map((s) => s.Value);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / values.length;

    let timeStr = latest.TimeStamp;
    try {
      const dt = new Date(latest.TimeStamp);
      if (!isNaN(dt.getTime())) {
        timeStr = format(dt, 'HH:mm');
      } else {
        const parts = latest.TimeStamp.split(' ');
        if (parts.length >= 2) {
          const timeParts = parts[1].split(':');
          if (timeParts.length >= 2) {
            timeStr = `${timeParts[0]}:${timeParts[1]}`;
          }
        }
      }
    } catch {
      // Keep original string if date parsing fails
    }

    return {
      currentLevel: latest.Value,
      currentTon: latest.Value * CONVERSION_FACTOR,
      latestTime: timeStr,
      minLevel: min,
      maxLevel: max,
      avgLevel: avg,
      sampleCount: sorted.length,
      hasData: true,
    };
  }, [tagData]);

  const limitLow = paramConfig.limitLow ?? 20;
  const limitHigh = paramConfig.limitHigh ?? 80;

  // Determine status: Normal, High, or Low
  const status = useMemo(() => {
    if (currentLevel === null) return 'NODATA';
    if (currentLevel < limitLow) return 'LOW';
    if (currentLevel > limitHigh) return 'HIGH';
    return 'NORMAL';
  }, [currentLevel, limitLow, limitHigh]);

  // Clamped percentage for SVG rendering
  const clampedPercent = Math.min(100, Math.max(0, currentLevel ?? 0));

  // Geometry for SVG Cylinder Tabung
  // Coordinate space: width=260, height=270
  // Tank dimensions:
  // Center X = 95, Radius X = 50, Radius Y = 13
  // Top center Y = 35, Bottom center Y = 225
  // Total vertical span = 190 px
  const TANK_CX = 95;
  const TANK_RX = 50;
  const TANK_RY = 13;
  const TANK_TOP_Y = 35;
  const TANK_BOTTOM_Y = 225;
  const TANK_HEIGHT = TANK_BOTTOM_Y - TANK_TOP_Y; // 190

  // Calculate liquid surface Y
  const liquidHeightPx = (clampedPercent / 100) * TANK_HEIGHT;
  const liquidSurfaceY = TANK_BOTTOM_Y - liquidHeightPx;

  // High & Low Limit Y positions on SVG
  const highLimitY = TANK_BOTTOM_Y - (limitHigh / 100) * TANK_HEIGHT;
  const lowLimitY = TANK_BOTTOM_Y - (limitLow / 100) * TANK_HEIGHT;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200/60 shadow-xs">
            <Gauge size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base tracking-tight">
                Level 023V102A
              </h3>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                023LI_019.pv
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Monitoring Tangki / Vessel 023V102A & Konversi Ton
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {latestTime && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-200">
              <Clock size={13} className="text-gray-400" />
              <span>
                Update: <strong className="text-gray-700">{latestTime}</strong>
              </span>
            </div>
          )}

          {status === 'NORMAL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Normal (20% - 80%)
            </span>
          )}
          {status === 'LOW' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle size={13} className="text-amber-600" />
              Low Level (&lt; {limitLow}%)
            </span>
          )}
          {status === 'HIGH' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              <AlertTriangle size={13} className="text-red-600" />
              High Level (&gt; {limitHigh}%)
            </span>
          )}
          {status === 'NODATA' && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              No Data
            </span>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Cylinder Tank Visualization (5 cols on md) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50/70 p-4 rounded-xl border border-slate-100">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <span>Visualisasi Tabung 023V102A</span>
          </div>

          <div className="relative w-full max-w-[270px] flex justify-center">
            <svg
              viewBox="0 0 250 260"
              className="w-full h-auto max-h-[260px] drop-shadow-sm select-none"
            >
              <defs>
                {/* Tank clip path matching cylinder interior and curved bottom */}
                <clipPath id="tankInnerClip">
                  <path
                    d={`
                      M ${TANK_CX - TANK_RX} ${TANK_TOP_Y}
                      L ${TANK_CX + TANK_RX} ${TANK_TOP_Y}
                      L ${TANK_CX + TANK_RX} ${TANK_BOTTOM_Y}
                      A ${TANK_RX} ${TANK_RY} 0 0 1 ${TANK_CX - TANK_RX} ${TANK_BOTTOM_Y}
                      Z
                    `}
                  />
                </clipPath>

                {/* Liquid body gradient */}
                <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0891b2" />
                  <stop offset="35%" stopColor="#06b6d4" />
                  <stop offset="70%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                {/* Liquid surface ellipse gradient */}
                <linearGradient id="surfaceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                </linearGradient>

                {/* Glass reflection gradient */}
                <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* 1. Tank Glass Background */}
              <path
                d={`
                  M ${TANK_CX - TANK_RX} ${TANK_TOP_Y}
                  L ${TANK_CX + TANK_RX} ${TANK_TOP_Y}
                  L ${TANK_CX + TANK_RX} ${TANK_BOTTOM_Y}
                  A ${TANK_RX} ${TANK_RY} 0 0 1 ${TANK_CX - TANK_RX} ${TANK_BOTTOM_Y}
                  Z
                `}
                fill="#f1f5f9"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {/* 2. Liquid Fill (clipped to tank bottom) */}
              {hasData && clampedPercent > 0 && (
                <g clipPath="url(#tankInnerClip)">
                  {/* Liquid column */}
                  <rect
                    x={TANK_CX - TANK_RX}
                    y={liquidSurfaceY}
                    width={TANK_RX * 2}
                    height={TANK_BOTTOM_Y - liquidSurfaceY + TANK_RY}
                    fill="url(#liquidGradient)"
                  />
                  {/* Specular sheen down the left */}
                  <rect
                    x={TANK_CX - TANK_RX + 6}
                    y={liquidSurfaceY}
                    width={10}
                    height={TANK_BOTTOM_Y - liquidSurfaceY + TANK_RY}
                    fill="url(#glassReflection)"
                  />
                </g>
              )}

              {/* 3. Liquid Top Ellipse (3D Meniscus) */}
              {hasData && clampedPercent > 0 && (
                <ellipse
                  cx={TANK_CX}
                  cy={liquidSurfaceY}
                  rx={TANK_RX}
                  ry={TANK_RY}
                  fill="url(#surfaceGradient)"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
              )}

              {/* 4. High / Low Limit Marker Lines across Tank */}
              {/* High Limit: 80% */}
              <line
                x1={TANK_CX - TANK_RX}
                y1={highLimitY}
                x2={TANK_CX + TANK_RX}
                y2={highLimitY}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Low Limit: 20% */}
              <line
                x1={TANK_CX - TANK_RX}
                y1={lowLimitY}
                x2={TANK_CX + TANK_RX}
                y2={lowLimitY}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* 5. Tank Outline & Top Rim */}
              {/* Top Ellipse (Rim) */}
              <ellipse
                cx={TANK_CX}
                cy={TANK_TOP_Y}
                rx={TANK_RX}
                ry={TANK_RY}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
              />
              {/* Left and Right Walls */}
              <line
                x1={TANK_CX - TANK_RX}
                y1={TANK_TOP_Y}
                x2={TANK_CX - TANK_RX}
                y2={TANK_BOTTOM_Y}
                stroke="#94a3b8"
                strokeWidth="2"
              />
              <line
                x1={TANK_CX + TANK_RX}
                y1={TANK_TOP_Y}
                x2={TANK_CX + TANK_RX}
                y2={TANK_BOTTOM_Y}
                stroke="#94a3b8"
                strokeWidth="2"
              />
              {/* Bottom Arc Outline */}
              <path
                d={`M ${TANK_CX - TANK_RX} ${TANK_BOTTOM_Y} A ${TANK_RX} ${TANK_RY} 0 0 0 ${TANK_CX + TANK_RX} ${TANK_BOTTOM_Y}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
              />

              {/* 6. Measurement Ruler on Right */}
              {/* 100% Mark */}
              <line
                x1={TANK_CX + TANK_RX}
                y1={TANK_TOP_Y}
                x2={TANK_CX + TANK_RX + 8}
                y2={TANK_TOP_Y}
                stroke="#64748b"
                strokeWidth="1.5"
              />
              <text
                x={TANK_CX + TANK_RX + 12}
                y={TANK_TOP_Y + 3}
                fontSize="9"
                fontWeight="600"
                fill="#475569"
              >
                100% (211 T)
              </text>

              {/* High Limit Label (80%) */}
              <line
                x1={TANK_CX + TANK_RX}
                y1={highLimitY}
                x2={TANK_CX + TANK_RX + 8}
                y2={highLimitY}
                stroke="#ef4444"
                strokeWidth="1.5"
              />
              <text
                x={TANK_CX + TANK_RX + 12}
                y={highLimitY + 3}
                fontSize="9"
                fontWeight="700"
                fill="#dc2626"
              >
                80% HH
              </text>

              {/* 50% Mark */}
              <line
                x1={TANK_CX + TANK_RX}
                y1={TANK_TOP_Y + TANK_HEIGHT * 0.5}
                x2={TANK_CX + TANK_RX + 6}
                y2={TANK_TOP_Y + TANK_HEIGHT * 0.5}
                stroke="#94a3b8"
                strokeWidth="1"
              />
              <text
                x={TANK_CX + TANK_RX + 12}
                y={TANK_TOP_Y + TANK_HEIGHT * 0.5 + 3}
                fontSize="8"
                fill="#64748b"
              >
                50%
              </text>

              {/* Low Limit Label (20%) */}
              <line
                x1={TANK_CX + TANK_RX}
                y1={lowLimitY}
                x2={TANK_CX + TANK_RX + 8}
                y2={lowLimitY}
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
              <text
                x={TANK_CX + TANK_RX + 12}
                y={lowLimitY + 3}
                fontSize="9"
                fontWeight="700"
                fill="#d97706"
              >
                20% LL
              </text>

              {/* 0% Mark */}
              <line
                x1={TANK_CX + TANK_RX}
                y1={TANK_BOTTOM_Y}
                x2={TANK_CX + TANK_RX + 8}
                y2={TANK_BOTTOM_Y}
                stroke="#64748b"
                strokeWidth="1.5"
              />
              <text
                x={TANK_CX + TANK_RX + 12}
                y={TANK_BOTTOM_Y + 3}
                fontSize="9"
                fontWeight="600"
                fill="#475569"
              >
                0% (0 T)
              </text>

              {/* 7. Current Level Pointer on Left Side */}
              {hasData && (
                <g>
                  {/* Horizontal indicator line pointing to meniscus */}
                  <line
                    x1={TANK_CX - TANK_RX - 8}
                    y1={liquidSurfaceY}
                    x2={TANK_CX - TANK_RX + 4}
                    y2={liquidSurfaceY}
                    stroke="#0284c7"
                    strokeWidth="2"
                  />
                  {/* Arrowhead */}
                  <polygon
                    points={`
                      ${TANK_CX - TANK_RX + 4},${liquidSurfaceY}
                      ${TANK_CX - TANK_RX - 2},${liquidSurfaceY - 4}
                      ${TANK_CX - TANK_RX - 2},${liquidSurfaceY + 4}
                    `}
                    fill="#0284c7"
                  />
                  {/* Current Value Badge on the left */}
                  <rect
                    x={4}
                    y={Math.min(TANK_BOTTOM_Y - 14, Math.max(TANK_TOP_Y - 6, liquidSurfaceY - 10))}
                    width={38}
                    height={20}
                    rx="4"
                    fill="#0284c7"
                  />
                  <text
                    x={23}
                    y={Math.min(TANK_BOTTOM_Y - 14, Math.max(TANK_TOP_Y - 6, liquidSurfaceY - 10)) + 14}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="bold"
                    fill="#ffffff"
                  >
                    {currentLevel?.toFixed(1)}%
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              Level Cairan
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              LL: 20%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              HH: 80%
            </span>
          </div>
        </div>

        {/* Right Columns: Level (%) & Ton Conversion & Stats (7 cols on md) */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          {/* Top row: 2 prominent cards for Percent & Ton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Level in Percent */}
            <div className="bg-gradient-to-br from-cyan-50/70 to-sky-50/40 rounded-xl p-4 border border-cyan-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-cyan-800 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Level Saat Ini
                </span>
                <Gauge size={16} className="text-cyan-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {currentLevel !== null ? currentLevel.toFixed(2) : '--'}
                </span>
                <span className="text-base font-bold text-cyan-700">%</span>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      status === 'HIGH'
                        ? 'bg-red-500'
                        : status === 'LOW'
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${clampedPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-medium">
                  <span>Min: {limitLow}%</span>
                  <span>Target: 50%</span>
                  <span>Max: {limitHigh}%</span>
                </div>
              </div>
            </div>

            {/* Card 2: Conversion in Ton (1% = 2.11 Ton) */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/40 rounded-xl p-4 border border-blue-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-blue-800 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Total Volume / Massa
                </span>
                <Scale size={16} className="text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-blue-900 tracking-tight">
                  {currentTon !== null ? currentTon.toFixed(2) : '--'}
                </span>
                <span className="text-base font-bold text-blue-700">Ton</span>
              </div>

              {/* Formula & Capacity Badge */}
              <div className="mt-3 flex flex-col gap-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded w-fit">
                  <span>Konversi:</span>
                  <span className="font-mono">1% = 2.11 Ton</span>
                </div>
                <span className="text-[10px] text-gray-500">
                  Kapasitas 100%: <strong>211.00 Ton</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Card: Daily Statistics & Limits Reference */}
          <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200 text-xs">
            <div className="flex items-center justify-between font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-2.5">
              <span>Statistik Tanggal {selectedDate || 'Hari Ini'}</span>
              <span className="text-[11px] font-normal text-gray-500">
                {sampleCount} titik pengukuran
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-2xs">
                <div className="flex items-center gap-1 text-gray-500 mb-0.5">
                  <TrendingDown size={12} className="text-blue-500" />
                  <span>Minimum</span>
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {minLevel !== null ? `${minLevel.toFixed(1)}%` : '-'}
                </div>
                <div className="text-[10px] text-gray-500">
                  {minLevel !== null ? `${(minLevel * CONVERSION_FACTOR).toFixed(2)} Ton` : '-'}
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-2xs">
                <div className="flex items-center gap-1 text-gray-500 mb-0.5">
                  <Scale size={12} className="text-cyan-500" />
                  <span>Rata-Rata</span>
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {avgLevel !== null ? `${avgLevel.toFixed(1)}%` : '-'}
                </div>
                <div className="text-[10px] text-gray-500">
                  {avgLevel !== null ? `${(avgLevel * CONVERSION_FACTOR).toFixed(2)} Ton` : '-'}
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-2xs">
                <div className="flex items-center gap-1 text-gray-500 mb-0.5">
                  <TrendingUp size={12} className="text-orange-500" />
                  <span>Maksimum</span>
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {maxLevel !== null ? `${maxLevel.toFixed(1)}%` : '-'}
                </div>
                <div className="text-[10px] text-gray-500">
                  {maxLevel !== null ? `${(maxLevel * CONVERSION_FACTOR).toFixed(2)} Ton` : '-'}
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex flex-wrap justify-between items-center text-[11px] text-gray-500">
              <span>
                Batas Aman: <strong>{limitLow}% ({ (limitLow * CONVERSION_FACTOR).toFixed(2) } T)</strong> – <strong>{limitHigh}% ({ (limitHigh * CONVERSION_FACTOR).toFixed(2) } T)</strong>
              </span>
              <span>
                Vessel Tag: <strong className="font-mono text-gray-700">023V102A</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
