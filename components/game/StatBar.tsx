export function StatBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 text-sm font-medium">{label}</div>
      <div className="flex-1 bg-gray-200 rounded-full h-3">
         <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <div className="w-8 text-right text-xs">{value}</div>
    </div>
  );
}
