import { useEffect, useState } from 'react';

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

const gregorianFmt = new Intl.DateTimeFormat('en-US', {
  day: 'numeric', month: 'short', year: 'numeric',
});

const MAJOR_TICKS = Array.from({ length: 12 }, (_, i) => i);
const MINOR_TICKS = Array.from({ length: 60 }, (_, i) => i).filter((i) => i % 5 !== 0);

function greeting(hour: number): { text: string; icon: string } {
  if (hour >= 5 && hour < 12) return { text: 'صبح بخیر', icon: 'wb_sunny' };
  if (hour >= 12 && hour < 17) return { text: 'بعدازظهر بخیر', icon: 'light_mode' };
  if (hour >= 17 && hour < 21) return { text: 'عصر بخیر', icon: 'wb_twilight' };
  return { text: 'شب بخیر', icon: 'dark_mode' };
}

/** Live glass clock: analog face + digital time + Jalali date. */
export default function ClockCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number;
    // re-sync to the real second boundary so the seconds hand never drifts
    const tick = () => {
      setNow(new Date());
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => window.clearTimeout(timer);
  }, []);

  const parts = timeFmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const hh = get('hour');
  const mm = get('minute');
  const ss = get('second');

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  // epoch-based seconds angle is monotonic, so the hand never "rewinds" at 59 -> 0
  const secAngle = Math.floor(now.getTime() / 1000) * 6;
  const minAngle = (m + s / 60) * 6;
  const hourAngle = ((h % 12) + m / 60) * 30;

  const g = greeting(h);

  return (
    <div className="clock-wrap">
      <div className="clock-card" role="group" aria-label={`ساعت ${hh}:${mm}، ${jalaliDate(now)}`}>
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

          <g className="clock-hand clock-hand--hour" style={{ transform: `rotate(${hourAngle}deg)` }}>
            <line x1="50" y1="54" x2="50" y2="28" />
          </g>
          <g className="clock-hand clock-hand--min" style={{ transform: `rotate(${minAngle}deg)` }}>
            <line x1="50" y1="56" x2="50" y2="17" />
          </g>
          <g className="clock-hand clock-hand--sec" style={{ transform: `rotate(${secAngle}deg)` }}>
            <line x1="50" y1="60" x2="50" y2="12" />
          </g>
          <circle cx="50" cy="50" r="3.4" className="clock-cap" />
          <circle cx="50" cy="50" r="1.3" className="clock-cap-dot" />
        </svg>

        <div className="clock-info">
          <div className="clock-greet">
            <span className="material-symbols-outlined">{g.icon}</span>
            {g.text}
          </div>
          <time className="clock-digital" dateTime={now.toISOString()} dir="ltr">
            <span className="clock-hm">{hh}</span>
            <span className="clock-colon">:</span>
            <span className="clock-hm">{mm}</span>
            <span className="clock-sec">{ss}</span>
          </time>
          <div className="clock-date">{jalaliDate(now)}</div>
          <div className="clock-date-en" dir="ltr">{gregorianFmt.format(now)}</div>
        </div>
      </div>
    </div>
  );
}