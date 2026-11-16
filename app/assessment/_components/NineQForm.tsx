'use client'

import { useActionState, useState } from 'react'
import { submit9Q } from '../actions'

type Saved = {
  q3?: number | null; q4?: number | null; q5?: number | null
  q6?: number | null; q7?: number | null; q8?: number | null
  q9?: number | null; q10?: number | null; q11?: number | null
}

const NINE_Q_ITEMS = [
  { key: 'q9_q3_3', text: 'หม่นหมอง ซึมเศร้า หรือสิ้นหวัง' },
  { key: 'q9_q3_4', text: 'ไม่มีความสนใจหรือความสุขในการทำสิ่งต่าง ๆ' },
  { key: 'q9_q3_5', text: 'นอนหลับยาก หลับ ๆ ตื่น ๆ หรือนอนมากเกินไป' },
  { key: 'q9_q3_6', text: 'รู้สึกเหนื่อย ล้า หรือไม่มีแรง' },
  { key: 'q9_q3_7', text: 'เบื่ออาหาร หรือกินมากเกินไป' },
  { key: 'q9_q3_8', text: 'รู้สึกว่าตัวเองไม่ดีพอ เป็นภาระให้คนอื่น หรือทำให้คนอื่นผิดหวัง' },
  { key: 'q9_q3_9', text: 'สมาธิไม่ดี จดจ่อกับสิ่งต่าง ๆ ได้ยาก' },
  { key: 'q9_q3_10', text: 'พูดหรือทำอะไรช้าลงผิดปกติ หรือกระสับกระส่าย อยู่ไม่สุข' },
  { key: 'q9_q3_11', text: 'คิดทำร้ายตัวเอง หรือคิดว่าตายไปน่าจะดีกว่า' },
]

const SCALE = ['ไม่มีเลย', 'มีบางวัน', 'มีบ่อย', 'มีแทบทุกวัน']

export default function NineQForm({ saved }: { saved?: Saved }) {
  const [state, action, pending] = useActionState(submit9Q, undefined)
  const savedVals = [saved?.q3, saved?.q4, saved?.q5, saved?.q6, saved?.q7, saved?.q8, saved?.q9, saved?.q10, saved?.q11]
  const [q11, setQ11] = useState<number | null>(savedVals[8] ?? null)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">9Q</p>
        <h1 className="text-xl font-semibold text-zinc-900">อาการในช่วง 2 สัปดาห์ที่ผ่านมา</h1>
        <p className="text-sm text-zinc-500">คุณมีอาการต่อไปนี้บ่อยแค่ไหน?</p>
      </div>

      <form action={action} className="space-y-6">
        {NINE_Q_ITEMS.map((item, i) => (
          <div key={item.key} className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">{i + 1}. {item.text}</p>
            <div className="grid grid-cols-4 gap-1">
              {SCALE.map((label, score) => (
                <label key={score} className="flex flex-col items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={item.key}
                    value={score}
                    defaultChecked={savedVals[i] === score}
                    onChange={i === 8 ? () => setQ11(score) : undefined}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="text-[10px] text-zinc-500 text-center leading-tight">{label}</span>
                </label>
              ))}
            </div>
            {/* Warn if q3.11 > 0 (STOP will trigger) */}
            {i === 8 && q11 !== null && q11 > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">
                  ขอบคุณที่ตอบตรง ๆ เรื่องนี้สำคัญมาก กดถัดไปเพื่อดูข้อมูลที่จะช่วยได้
                </p>
              </div>
            )}
          </div>
        ))}

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
