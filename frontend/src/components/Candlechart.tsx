import { useEffect, useMemo, useRef, useState } from 'react';
import type { CandlePoint } from '../types';
import { formatToman } from '../utils/format';

const nf = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' });
const longDate = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' });

const M = { top: 14, right: 12, bottom: 26, left: 46 };
const VOL_H = 44;
const GAP = 10;

interface CandleChartProps {
  data: CandlePoint[];
  height?: number;
}

/**
 * Lightweight SVG candlestick chart (no extra dependency).
 * Colours come from CSS variables, so it follows the light / dark theme automatically.
 */
export default function CandleChart({ data, height = 320 }: CandleChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const apply = (w: number) => setWidth(Math.max(280, Math.floor(w)));
    apply(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => apply(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotW = width - M.left - M.right;
  const priceH = height - M.top - M.bottom - VOL_H - GAP;

  const scale = useMemo(() => {
    if (data.length === 0) return null;
    const lo = Math.min(...data.map((d) => d.low));
    const hi = Math.max(...data.map((d) => d.high));
    const pad = (hi - lo || Math.abs(hi) || 1) * 0.08;
    const min = lo - pad;
    const max = hi + pad;
    const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
    const vmax = Math.max(...data.map((d) => d.volume), 1);
    return { min, max, ticks, vmax };
  }, [data]);

  if (!scale || data.length === 0) {
    return <div className="empty-state">داده‌ای برای نمایش نمودار کندل وجود ندارد</div>;
  }

  const y = (v: number) => M.top + ((scale.max - v) / (scale.max - scale.min)) * priceH;
  const slot = plotW / data.length;
  const bodyW = Math.min(22, Math.max(4, slot * 0.56));
  const cx = (i: number) => M.left + slot * (i + 0.5);
  const volTop = M.top + priceH + GAP;
  const labelEvery = Math.max(1, Math.ceil(58 / slot));
  const last = data[data.length - 1];
  const hovered = hover !== null ? data[hover] : null;
  const zeroVisible = scale.min < 0 && scale.max > 0;

  return (
    <div className="candle-wrap" ref={wrapRef} onMouseLeave={() => setHover(null)}>
      <svg className="candle-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="نمودار کندل جریان نقدی">
        {/* horizontal grid + y labels (millions of toman) */}
        {scale.ticks.map((t, i) => (
          <g key={i}>
            <line className="candle-grid" x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
            <text className="candle-axis" x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
              {nf.format(t / 1_000_000)}
            </text>
          </g>
        ))}

        {zeroVisible && <line className="candle-zero" x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />}

        {/* last-close marker */}
        <line
          className={`candle-last ${last.close >= last.open ? 'up' : 'down'}`}
          x1={M.left} x2={width - M.right} y1={y(last.close)} y2={y(last.close)}
        />

        {data.map((d, i) => {
          const up = d.close >= d.open;
          const top = y(Math.max(d.open, d.close));
          const h = Math.max(2, Math.abs(y(d.open) - y(d.close)));
          const vh = (d.volume / scale.vmax) * VOL_H;
          const dim = hover !== null && hover !== i;
          return (
            <g key={d.week} className={`candle ${up ? 'up' : 'down'}${dim ? ' dim' : ''}`}>
              <rect className="vol" x={cx(i) - bodyW / 2} y={volTop + VOL_H - vh} width={bodyW} height={vh} rx={2} />
              <line className="wick" x1={cx(i)} x2={cx(i)} y1={y(d.high)} y2={y(d.low)} />
              <rect className="body" x={cx(i) - bodyW / 2} y={top} width={bodyW} height={h} rx={3} />
            </g>
          );
        })}

        {/* x labels */}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.week} className="candle-axis" x={cx(i)} y={height - 8} textAnchor="middle">
              {shortDate.format(new Date(`${d.week}T12:00:00`))}
            </text>
          ) : null
        )}

        {/* crosshair + hit areas */}
        {hover !== null && <line className="candle-cross" x1={cx(hover)} x2={cx(hover)} y1={M.top} y2={volTop + VOL_H} />}
        {data.map((d, i) => (
          <rect
            key={`hit-${d.week}`}
            x={M.left + slot * i} y={M.top} width={slot} height={priceH + GAP + VOL_H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onPointerDown={() => setHover(i)}
          />
        ))}
      </svg>

      {hovered && hover !== null && (
        <div
          className="candle-tip"
          dir="rtl"
          style={{ left: Math.min(Math.max(cx(hover), 96), width - 96) }}
        >
          <div className="candle-tip-title">
            هفته‌ی {longDate.format(new Date(`${hovered.week}T12:00:00`))}
          </div>
          <div className="candle-tip-row"><span>موجودی ابتدا</span><b>{formatToman(hovered.open)}</b></div>
          <div className="candle-tip-row"><span>بیشینه</span><b>{formatToman(hovered.high)}</b></div>
          <div className="candle-tip-row"><span>کمینه</span><b>{formatToman(hovered.low)}</b></div>
          <div className="candle-tip-row"><span>موجودی پایان</span><b className={hovered.close >= hovered.open ? 'pos' : 'neg'}>{formatToman(hovered.close)}</b></div>
          <div className="candle-tip-row"><span>گردش</span><b>{formatToman(hovered.volume)}</b></div>
        </div>
      )}
    </div>
  );
}