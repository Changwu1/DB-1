'use client'

import { useActionState } from 'react'
import { submitShiftWork } from '../actions'

export default function ShiftWorkForm({ saved }: { saved?: boolean | null }) {
  const [state, action, pending] = useActionState(submitShiftWork, undefined)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">ไลฟ์สไตล์</p>
        <h1 className="text-xl font-semibold text-zinc-900">งานของคุณเป็นกะหรือเวลางานไม่แน่นอนไหม?</h1>
        <p className="text-sm text-zinc-500">เช่น ทำงานกลางคืน หรือเวลาเริ่มงานเปลี่ยนแต่ละสัปดาห์</p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          {[{ value: 'yes', label: 'ใช่' }, { value: 'no', label: 'ไม่ใช่' }].map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
            >
              <input
                type="radio"
                name="shift_work"
                value={value}
                defaultChecked={saved === (value === 'yes')}
                className="h-4 w-4 accent-indigo-600"
              />
              <span className="text-sm text-zinc-700">{label}</span>
            </label>
          ))}
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'กำลังบันทึก…' : 'ถัดไป'}
        </button>
      </form>
    </div>
  )
}
