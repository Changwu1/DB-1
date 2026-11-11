'use client'

import { useActionState } from 'react'
import { submitSleepNights } from '../actions'

export default function SleepNightsForm({ saved }: { saved?: number | null }) {
  const [state, action, pending] = useActionState(submitSleepNights, undefined)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">ข้อที่ 2</p>
        <h1 className="text-xl font-semibold text-zinc-900">ใน 1 เดือนที่ผ่านมา มีกี่คืน/สัปดาห์ที่มีปัญหาการนอน?</h1>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="nights_per_week" className="text-sm font-medium text-zinc-700">
            จำนวนคืนต่อสัปดาห์ (0–7)
          </label>
          <input
            id="nights_per_week"
            name="nights_per_week"
            type="number"
            min={0}
            max={7}
            defaultValue={saved ?? ''}
            placeholder="เช่น 5"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

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
