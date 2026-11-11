'use client'

import { useActionState } from 'react'
import { submitSleepOpportunity } from '../actions'

export default function SleepOpportunityForm({ saved }: { saved?: boolean | null }) {
  const [state, action, pending] = useActionState(submitSleepOpportunity, undefined)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">ข้อที่ 4</p>
        <h1 className="text-xl font-semibold text-zinc-900">
          คุณมีโอกาสและเวลาเพียงพอสำหรับการนอนหลับไหม?
        </h1>
        <p className="text-sm text-zinc-500">
          เช่น คุณมีเวลานอนได้อย่างน้อย 7–8 ชั่วโมงถ้าต้องการ
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'ใช่ มีโอกาสนอนเพียงพอ' },
            { value: 'no', label: 'ไม่ใช่ ไม่ค่อยมีโอกาสนอน' },
          ].map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 cursor-pointer has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
            >
              <input
                type="radio"
                name="adequate_opportunity"
                value={value}
                defaultChecked={saved === (value === 'yes')}
                className="h-4 w-4 accent-zinc-900"
              />
              <span className="text-sm text-zinc-700">{label}</span>
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
