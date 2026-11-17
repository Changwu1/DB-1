import Link from 'next/link'

export interface NightItem {
  date: string         // YYYY-MM-DD
  dayAbbr: string      // 'จ.', 'อ.', …
  dayNum: number
  status: 'filled' | 'skipped' | 'unfilled'
  isSelected: boolean
  isYesterday: boolean
}

export default function WeekStrip({ nights }: { nights: NightItem[] }) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-stone-100">
      <div className="flex gap-1 justify-between">
        {nights.map(night => {
          const href = night.isYesterday ? '/diary' : `/diary?date=${night.date}`

          const bgClass =
            night.status === 'filled'
              ? 'bg-indigo-600'
              : night.status === 'skipped'
                ? 'bg-stone-100'
                : 'bg-amber-50 border border-amber-300'

          const abbrClass =
            night.status === 'filled'
              ? 'text-indigo-200'
              : night.status === 'skipped'
                ? 'text-stone-400'
                : 'text-amber-500'

          const numClass =
            night.status === 'filled'
              ? 'text-white'
              : night.status === 'skipped'
                ? 'text-stone-400 line-through'
                : 'text-amber-700'

          const ringClass = night.isSelected
            ? 'ring-2 ring-offset-1 ring-indigo-500'
            : ''

          // Status dot at bottom of each pill
          const dotClass =
            night.status === 'filled'
              ? 'bg-white opacity-70'
              : night.status === 'skipped'
                ? 'bg-stone-300'
                : 'bg-amber-400'

          return (
            <Link
              key={night.date}
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-2 flex-1 ${bgClass} ${ringClass}`}
            >
              <span className={`text-[10px] leading-none font-medium ${abbrClass}`}>
                {night.dayAbbr}
              </span>
              <span className={`text-[13px] font-bold leading-none ${numClass}`}>
                {night.dayNum}
              </span>
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${dotClass}`} />
            </Link>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 justify-center">
        <span className="flex items-center gap-1 text-[10px] text-stone-400">
          <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" /> บันทึกแล้ว
        </span>
        <span className="flex items-center gap-1 text-[10px] text-stone-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> ยังไม่ได้บันทึก
        </span>
        <span className="flex items-center gap-1 text-[10px] text-stone-400">
          <span className="w-2 h-2 rounded-full bg-stone-300 inline-block" /> ข้ามแล้ว
        </span>
      </div>
    </div>
  )
}
