'use client'

import { useActionState } from 'react'
import { submitSleepAids } from '../actions'

type Saved = {
  prescription?: string | null; otc?: string | null
  alcohol?: string | null; supplement?: string | null
}

const AIDS = [
  { name: 'sleep_aid_prescription', label: 'ยาแพทย์สั่ง', detail: 'เช่น โลราซีแพม, โซลพิเดม' },
  { name: 'sleep_aid_otc', label: 'ยาซื้อเอง/ยาแก้แพ้', detail: 'เช่น ไดเฟนไฮดรามีน' },
  { name: 'sleep_aid_alcohol', label: 'แอลกอฮอล์', detail: 'ดื่มเพื่อช่วยหลับ' },
  { name: 'sleep_aid_supplement', label: 'อาหารเสริม', detail: 'เช่น เมลาโทนิน, กัมมี่' },
]

const FREQ_OPTIONS = [
  { value: 'ไม่เคย', label: 'ไม่เคย' },
  { value: 'บางครั้ง', label: 'บางครั้ง' },
  { value: '3คืน+', label: '3 คืน/สัปดาห์ขึ้นไป' },
]

export default function SleepAidsForm({ saved }: { saved?: Saved }) {
  const [state, action, pending] = useActionState(submitSleepAids, undefined)
  const savedVals: Record<string, string | null | undefined> = {
    sleep_aid_prescription: saved?.prescription,
    sleep_aid_otc: saved?.otc,
    sleep_aid_alcohol: saved?.alcohol,
    sleep_aid_supplement: saved?.supplement,
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">สิ่งช่วยหลับ</p>
        <h1 className="text-xl font-semibold text-zinc-900">ใน 1 เดือนที่ผ่านมา คุณใช้สิ่งเหล่านี้ช่วยหลับบ่อยแค่ไหน?</h1>
      </div>

      <form action={action} className="space-y-5">
        {AIDS.map(aid => (
          <div key={aid.name} className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">{aid.label}</p>
            {aid.detail && <p className="text-xs text-zinc-400">{aid.detail}</p>}
            <div className="flex gap-2">
              {FREQ_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex-1 flex items-center justify-center rounded-xl border border-zinc-200 px-2 py-2.5 cursor-pointer has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50 text-center"
                >
                  <input
                    type="radio"
                    name={aid.name}
                    value={value}
                    defaultChecked={savedVals[aid.name] === value}
                    className="sr-only"
                  />
                  <span className="text-xs text-zinc-700 leading-tight">{label}</span>
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
          {pending ? 'กำลังคำนวณผล…' : 'ดูผลลัพธ์'}
        </button>
      </form>
    </div>
  )
}
