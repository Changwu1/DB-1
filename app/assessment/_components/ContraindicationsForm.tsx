'use client'
import SubmitButton from './SubmitButton'

import { useActionState } from 'react'
import { submitContraindications } from '../actions'

type Saved = {
  bipolar?: boolean | null; psychosis?: boolean | null; epilepsy?: boolean | null
  parasomnia?: boolean | null; machinery?: boolean | null
}

const ITEMS = [
  { name: 'bipolar', label: 'โรคอารมณ์สองขั้ว (ไบโพลาร์)', detail: 'คุณมีอาการหรืออยู่ระหว่างรักษาไหม?' },
  { name: 'psychosis', label: 'โรคจิตหรือโรคจิตเภท', detail: 'คุณมีอาการหรืออยู่ระหว่างรักษาไหม?' },
  { name: 'epilepsy', label: 'โรคลมชัก', detail: 'คุณมีประวัติชักหรืออยู่ระหว่างรักษาไหม?' },
  { name: 'parasomnia', label: 'ละเมอบ่อย ๆ', detail: 'เช่น เดินหลับ นอนพูด หรือทำสิ่งต่าง ๆ ขณะหลับโดยไม่รู้ตัว' },
  { name: 'machinery', label: 'ขับรถระยะไกลหรือคุมเครื่องจักรหนักเป็นอาชีพ', detail: '' },
]

export default function ContraindicationsForm({ saved }: { saved?: Saved }) {
  const [state, action, pending] = useActionState(submitContraindications, undefined)
  const savedVals: Record<string, boolean | null | undefined> = {
    bipolar: saved?.bipolar, psychosis: saved?.psychosis, epilepsy: saved?.epilepsy,
    parasomnia: saved?.parasomnia, machinery: saved?.machinery,
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">ข้อห้าม</p>
        <h1 className="text-xl font-semibold text-zinc-900">ข้อมูลสุขภาพเพิ่มเติม</h1>
        <p className="text-sm text-zinc-500">ตอบ ใช่/ไม่ใช่ สำหรับแต่ละข้อ</p>
      </div>

      <form action={action} className="space-y-5">
        {ITEMS.map(item => (
          <div key={item.name} className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">{item.label}</p>
            {item.detail && <p className="text-xs text-zinc-400">{item.detail}</p>}
            <div className="flex gap-2">
              {[{ value: 'yes', label: 'ใช่' }, { value: 'no', label: 'ไม่ใช่' }].map(({ value, label }) => (
                <label
                  key={value}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
                >
                  <input
                    type="radio"
                    name={item.name}
                    value={value}
                    defaultChecked={savedVals[item.name] === (value === 'yes')}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="text-sm text-zinc-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton pending={pending} label="ถัดไป" />
      </form>
    </div>
  )
}
