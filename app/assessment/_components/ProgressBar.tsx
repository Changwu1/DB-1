interface Props {
  step: number
  total: number
}

export default function ProgressBar({ step, total }: Props) {
  const pct = Math.round((step / total) * 100)
  return (
    <div className="pt-4 px-6 pb-1 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-zinc-400">แบบประเมิน</span>
        <span className="text-xs text-zinc-400">{step} / {total}</span>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
