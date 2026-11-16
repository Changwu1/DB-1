'use client'
import SubmitButton from './SubmitButton'

import { useActionState } from 'react'
import { submitPregnant } from '../actions'

const OPTIONS = [
  { value: 'ใช่', label: 'ใช่ ตั้งครรภ์อยู่หรือคลอดมาไม่ถึง 6 เดือน' },
  { value: 'ไม่ใช่', label: 'ไม่ใช่' },
  { value: 'ไม่เกี่ยวข้อง', label: 'ไม่เกี่ยวข้องกับฉัน' },
]

export default function PregnantForm({ saved }: { saved?: string | null }) {
  const [state, action, pending] = useActionState(submitPregnant, undefined)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">ไลฟ์สไตล์</p>
        <h1 className="text-xl font-semibold text-zinc-900">คุณตั้งครรภ์อยู่หรือเพิ่งคลอดในช่วง 6 เดือนที่ผ่านมาไหม?</h1>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          {OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
            >
              <input
                type="radio"
                name="pregnant_postnatal"
                value={value}
                defaultChecked={saved === value}
                className="h-4 w-4 accent-indigo-600"
              />
              <span className="text-sm text-zinc-700">{label}</span>
            </label>
          ))}
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton pending={pending} label="ถัดไป" />
      </form>
    </div>
  )
}
