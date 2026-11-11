'use client'

import { useActionState } from 'react'
import { submit2Q } from '../actions'

type Saved = { q1?: boolean | null; q2?: boolean | null }

const TWO_Q = [
  {
    name: 'q2_q1',
    text: 'ในช่วง 2 สัปดาห์ที่ผ่านมา คุณรู้สึกหม่นหมอง ซึมเศร้า หรือสิ้นหวังบ้างไหม?',
  },
  {
    name: 'q2_q2',
    text: 'ในช่วง 2 สัปดาห์ที่ผ่านมา คุณรู้สึกไม่มีความสนใจหรือความสุขในการทำสิ่งต่าง ๆ บ้างไหม?',
  },
]

export default function TwoQForm({ saved }: { saved?: Saved }) {
  const [state, action, pending] = useActionState(submit2Q, undefined)
  const savedVals = [saved?.q1, saved?.q2]

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">2Q</p>
        <h1 className="text-xl font-semibold text-zinc-900">ด้านอารมณ์</h1>
      </div>

      <form action={action} className="space-y-6">
        {TWO_Q.map((q, i) => (
          <div key={q.name} className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">{q.text}</p>
            <div className="space-y-2">
              {[
                { value: 'yes', label: 'ใช่' },
                { value: 'no', label: 'ไม่ใช่' },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 cursor-pointer has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
                >
                  <input
                    type="radio"
                    name={q.name}
                    value={value}
                    defaultChecked={savedVals[i] === (value === 'yes')}
                    className="h-4 w-4 accent-zinc-900"
                  />
                  <span className="text-sm text-zinc-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

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
