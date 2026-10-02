export type KpiTone = 'revenue' | 'expense' | 'profit' | 'outstanding';

interface KpiCardProps {
  tone: KpiTone;
  icon: string;
  label: string;
  value: string;
  hint?: string;
}

const UNIT = 'تومان';

/** Splits "۱۲۳٬۰۰۰ تومان" into the figure and a smaller, muted unit. */
function splitUnit(value: string): { num: string; unit: string } {
  const trimmed = value.trim();
  if (trimmed.endsWith(UNIT)) {
    return { num: trimmed.slice(0, -UNIT.length).trim(), unit: UNIT };
  }
  return { num: trimmed, unit: '' };
}

export default function KpiCard({ tone, icon, label, value, hint }: KpiCardProps) {
  const { num, unit } = splitUnit(value);
  return (
    <div className="kpi-card" data-tone={tone}>
      <div className="kpi-top">
        <div className="kpi-label">{label}</div>
        <div className="kpi-icon" aria-hidden="true">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div className="kpi-value figure">
        <span className="kpi-num">{num}</span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}