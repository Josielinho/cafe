interface Props {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: Props) {
  const percent = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 text-sm text-[#8f7f72]">
        <span className="font-medium text-[#6e4f33]">{label ?? 'Avance de la encuesta'}</span>
        <span className="font-semibold text-[#306131]">{Math.round(percent)}%</span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f1ede6]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#6e4f33_0%,#b08f4b_48%,#306131_100%)] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
