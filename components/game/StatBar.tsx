interface StatBarProps {
  label: string;
  value: number;
}

export function StatBar({ label, value }: StatBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-3" data-testid={`stat-${label.toLowerCase()}`}>
      <span className="w-24 shrink-0 text-sm text-text-muted">{label}</span>
      <div
        className="h-3 flex-1 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-3 rounded-full bg-primary" style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-sm tabular-nums text-text">{clamped}</span>
    </div>
  );
}