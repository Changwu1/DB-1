'use client'
import SubmitButton from './SubmitButton'

import { useActionState, useState } from 'react'
import { submitRLS } from '../actions'

type Saved = { q1?: boolean | null; q2?: boolean | null; q3?: boolean | null; q4?: boolean | null }

const RLS_Q2_4 = [
  { name: 'rls_q2', text: 'อาการนี้เกิดขึ้นหรือแย่ลงตอนนั่งหรือนอนไหม?' },
  { name: 'rls_q3', text: 'อาการนี้ดีขึ้นเมื่อขยับหรือเดินไหม?' },
  { name: 'rls_q4', text: 'อาการนี้แย่ที่สุดในตอนเย็นหรือกลางคืนไหม?' },
]

export default function RLSForm({ saved }: { saved?: Saved }) {
  const [state, action, pending] = useActionState(submitRLS, undefined)
  const [q1, setQ1] = useState<boolean | null>(saved?.q1 ?? null)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">RLS</p>
        <h1 className="text-xl font-semibold text-zinc-900">อาการขา</h1>
      </div>

      <form action={action} className="space-y-5">
        {/* RLS Q1 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">
            คุณมีอาการขาอยากขยับหรือรู้สึกไม่สบายที่ขาในตอนกลางคืน ทำให้หยุดนิ่งได้ยากไหม?
          </p>
          <div className="flex gap-2">
            {[{ value: 'yes', label: 'ใช่' }, { value: 'no', label: 'ไม่ใช่' }].map(({ value, label }) => (
              <label
                key={value}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
              >
                <input
                  type="radio"
                  name="rls_q1"
                  value={value}
                  defaultChecked={saved?.q1 === (value === 'yes')}
                  onChange={() => setQ1(value === 'yes')}
                  className="h-4 w-4 accent-indigo-600"
                />
                <span className="text-sm text-zinc-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* RLS Q2–Q4: shown only if Q1 = yes */}
        {q1 === true && RLS_Q2_4.map(q => (
          <div key={q.name} className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">{q.text}</p>
            <div className="flex gap-2">
              {[{ value: 'yes', label: 'ใช่' }, { value: 'no', label: 'ไม่ใช่' }].map(({ value, label }) => {
                const sv = q.name === 'rls_q2' ? saved?.q2 : q.name === 'rls_q3' ? saved?.q3 : saved?.q4
                return (
                  <label
                    key={value}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
                  >
                    <input
                      type="radio"
                      name={q.name}
                      value={value}
                      defaultChecked={sv === (value === 'yes')}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <span className="text-sm text-zinc-700">{label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton pending={pending} label="ถัดไป" />
      </form>
    </div>
  )
}
