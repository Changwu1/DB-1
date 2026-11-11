'use client'

import { useActionState, useState } from 'react'
import { submitSleepType } from '../actions'

type Props = {
  saved?: { age?: number | null; types?: string[] | null }
}

const SLEEP_TYPES = [
  'หลับยาก',
  'ตื่นกลางดึก',
  'ตื่นเช้าเกิน',
  'ไม่มีปัญหาเหล่านี้',
]

export default function SleepTypeForm({ saved }: Props) {
  const [state, action, pending] = useActionState(submitSleepType, undefined)
  const [selected, setSelected] = useState<string[]>(saved?.types ?? [])

  function toggle(t: string) {
    if (t === 'ไม่มีปัญหาเหล่านี้') {
      setSelected(['ไม่มีปัญหาเหล่านี้'])
      return
    }
    setSelected(prev => {
      const without = prev.filter(x => x !== 'ไม่มีปัญหาเหล่านี้')
      return prev.includes(t) ? without.filter(x => x !== t) : [...without, t]
    })
  }

  if (state?.error === 'underage') {
    return (
      <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
        <h1 className="text-xl font-semibold text-zinc-900">โปรแกรมนี้สำหรับผู้ใหญ่อายุ 18 ปีขึ้นไป</h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          ขอบคุณที่สนใจ โปรแกรมนี้ออกแบบและทดสอบสำหรับผู้ใหญ่เท่านั้น
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">ข้อที่ 1</p>
        <h1 className="text-xl font-semibold text-zinc-900">ข้อมูลเบื้องต้น</h1>
      </div>

      <form action={action} className="space-y-6">
        {/* Age */}
        <div className="space-y-2">
          <label htmlFor="age" className="text-sm font-medium text-zinc-700">อายุของคุณ (ปี)</label>
          <input
            id="age"
            name="age"
            type="number"
            min={0}
            max={100}
            defaultValue={saved?.age ?? ''}
            placeholder="เช่น 30"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {/* Sleep problem types */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">ใน 1 เดือนที่ผ่านมา คุณมีปัญหาการนอนแบบใดบ้าง?</p>
          <p className="text-xs text-zinc-400">เลือกได้หลายข้อ</p>
          <div className="space-y-2">
            {SLEEP_TYPES.map(t => (
              <label
                key={t}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 cursor-pointer has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  name="sleep_problem_types"
                  value={t}
                  checked={selected.includes(t)}
                  onChange={() => toggle(t)}
                  className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                />
                <span className="text-sm text-zinc-700">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {state?.error && state.error !== 'underage' && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'กำลังบันทึก…' : 'ถัดไป'}
        </button>
      </form>
    </div>
  )
}
