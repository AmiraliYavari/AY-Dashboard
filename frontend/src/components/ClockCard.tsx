import { useEffect, useRef, useState } from 'react';

const timeFmt = new Intl.DateTimeFormat('fa-IR', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
const dateFmt = new Intl.DateTimeFormat('fa-IR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

/** ICU orders fa-IR dates as "۱۴۰۵ مهر ۱۰, جمعه"; build the natural order "جمعه ۱۰ مهر ۱۴۰۵" ourselves. */
function jalaliDate(d: Date): string {
  const parts = dateFmt.formatToParts(d);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${pick('weekday')} ${pick('day')} ${pick('month')} ${pick('year')}`;
}

const MAJOR_TICKS = Array.from({ length: 12 }, (_, i) => i);
const MINOR_TICKS = Array.from({ length: 60 }, (_, i) => i).filter((i) => i % 5 !== 0);

/**
 * Analog clock + digital time + Jalali date (no card around it).
 * The hands are driven straight from the real clock every frame and written to the SVG
 * `transform` attribute, so there is no CSS transition, no wrap-around glitch at 59 -> 0,
 * and no React re-render at 60fps.
 */
export default function ClockCard() {
  const [now, setNow] = useState(() => new Date());
  const hourRef = useRef<SVGGElement>(null);
  const minRef = useRef<SVGGElement>(null);
  const secRef = useRef<SVGGElement>(null);

  // digital readout: re-sync to the real second boundary
  useEffect(() => {
    let timer = 0;
    const tick = () => {
      setNow(new Date());
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => window.clearTimeout(timer);
  }, []);

  // analog hands
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const paint = () => {
      const d = new Date();
      const sec = d.getSeconds() + (reduce ? 0 : d.getMilliseconds() / 1000);
      const min = d.getMinutes() + sec / 60;
      const hour = (d.getHours() % 12) + min / 60;
      secRef.current?.setAttribute('transform', `rotate(${sec * 6} 50 50)`);
      minRef.current?.setAttribute('transform', `rotate(${min * 6} 50 50)`);
      hourRef.current?.setAttribute('transform', `rotate(${hour * 30} 50 50)`);
      raf = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, []);

  const parts = timeFmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const hh = get('hour');
  const mm = get('minute');
  const ss = get('second');

  return (
    <div className="clock" role="group" aria-label={`ساعت ${hh}:${mm}، ${jalaliDate(now)}`}>
      <svg className="clock-analog" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="clockFace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--clock-face-a)" />
            <stop offset="1" stopColor="var(--clock-face-b)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="47" className="clock-rim" />
        <circle cx="50" cy="50" r="44" fill="url(#clockFace)" className="clock-face" />

        {MINOR_TICKS.map((i) => (
          <line key={i} x1="50" y1="9" x2="50" y2="11.4" className="clock-tick"
            transform={`rotate(${i * 6} 50 50)`} />
        ))}
        {MAJOR_TICKS.map((i) => (
          <line key={i} x1="50" y1="8.5" x2="50" y2="14" className="clock-tick clock-tick--major"
            transform={`rotate(${i * 30} 50 50)`} />
        ))}

        <g ref={hourRef} className="clock-hand clock-hand--hour"><line x1="50" y1="55" x2="50" y2="28" /></g>
        <g ref={minRef} className="clock-hand clock-hand--min"><line x1="50" y1="57" x2="50" y2="15" /></g>
        <g ref={secRef} className="clock-hand clock-hand--sec"><line x1="50" y1="62" x2="50" y2="11" /></g>
        <circle cx="50" cy="50" r="3.4" className="clock-cap" />
        <circle cx="50" cy="50" r="1.4" className="clock-cap-dot" />
      </svg>

      <time className="clock-digital" dateTime={now.toISOString()} dir="ltr">
        <span>{hh}</span>
        <span className="clock-colon">:</span>
        <span>{mm}</span>
        <span className="clock-sec">{ss}</span>
      </time>

      <div className="clock-date">{jalaliDate(now)}</div>
    </div>
  );
}