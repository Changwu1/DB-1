'use client'

import { useActionState } from 'react'
import { submitSleepDuration } from '../actions'

const OPTIONS = ['น้อยกว่า 3 เดือน', '3–6 เดือน', 'มากกว่า 6 เดือน'] as const

export default function SleepDurationForm({ saved }: { saved?: string | null }) {
  const [state, action, pending] = useActionState(submitSleepDuration, undefined)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">ข้อที่ 3</p>
        <h1 className="text-xl font-semibold text-zinc-900">ปัญหาการนอนนี้เป็นมานานแค่ไหนแล้ว?</h1>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          {OPTIONS.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 cursor-pointer has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
            >
              <input
                type="radio"
                name="problem_duration"
                value={opt}
                defaultChecked={saved === opt}
                className="h-4 w-4 accent-zinc-900"
              />
              <span className="text-sm text-zinc-700">{opt}</span>
            </label>
          ))}
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
