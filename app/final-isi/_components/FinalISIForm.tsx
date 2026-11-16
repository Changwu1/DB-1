'use client'

import { useActionState } from 'react'
import { submitFinalISI } from '../actions'

const ISI_QUESTIONS = [
  { key: 'isi_q1', text: 'ความยากลำบากในการหลับ' },
  { key: 'isi_q2', text: 'ความยากลำบากในการหลับต่อ หลังตื่นกลางดึก' },
  { key: 'isi_q3', text: 'ปัญหาตื่นเร็วกว่าที่ต้องการ' },
  { key: 'isi_q4', text: 'ความพึงพอใจกับการนอนหลับของคุณ' },
  { key: 'isi_q5', text: 'ปัญหาการนอนกระทบชีวิตประจำวัน เช่น เหนื่อยล้า ทำงานได้ไม่เต็มที่ อารมณ์แปรปรวน' },
  { key: 'isi_q6', text: 'คนรอบข้างสังเกตเห็นว่าคุณมีปัญหาการนอน' },
  { key: 'isi_q7', text: 'คุณกังวลเรื่องการนอนไม่หลับ' },
]

const SCALE_Q4 = ['พอใจมาก', 'พอใจ', 'เฉยๆ', 'ไม่ค่อยพอใจ', 'ไม่พอใจเลย']
const SCALE_OTHER = ['ไม่มีเลย', 'เล็กน้อย', 'ปานกลาง', 'ค่อนข้างมาก', 'มากที่สุด']

export default function FinalISIForm() {
  const [state, action, pending] = useActionState(submitFinalISI, undefined)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">ISI รอบสุดท้าย</p>
        <h1 className="text-xl font-semibold text-zinc-900">แบบประเมินความรุนแรงของการนอนไม่หลับ</h1>
        <p className="text-sm text-zinc-500">ใน 2 สัปดาห์ที่ผ่านมา คุณมีปัญหาต่อไปนี้มากน้อยแค่ไหน?</p>
      </div>

      <form action={action} className="space-y-6">
        {ISI_QUESTIONS.map((q, i) => {
          const scale = i === 3 ? SCALE_Q4 : SCALE_OTHER
          return (
            <div key={q.key} className="space-y-2">
              <p className="text-sm font-medium text-zinc-700">{i + 1}. {q.text}</p>
              <div className="grid grid-cols-5 gap-1">
                {scale.map((label, score) => (
                  <label key={score} className="flex flex-col items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={q.key}
                      value={score}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <span className="text-[10px] text-zinc-500 text-center leading-tight">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'กำลังบันทึก…' : 'ดูผลลัพธ์'}
        </button>
      </form>
    </div>
  )
}
