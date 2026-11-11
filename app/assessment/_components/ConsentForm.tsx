'use client'

import { useActionState, useState } from 'react'
import { submitConsent } from '../actions'

export default function ConsentForm() {
  const [state, action, pending] = useActionState(submitConsent, undefined)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">ก่อนเริ่มประเมิน</h1>
      </div>

      <p className="text-sm text-zinc-700 leading-relaxed">
        แบบประเมินนี้ใช้ดูว่าโปรแกรมปรับพฤติกรรมการนอน (CBT-I) แบบทำเองที่บ้าน
        เหมาะกับคุณไหม ไม่ใช่การวินิจฉัยโรค ใช้เวลาประมาณ 8–10 นาที
      </p>
      <p className="text-sm text-zinc-700 leading-relaxed">
        คำตอบของคุณจะผูกกับชื่อบัญชีและอีเมลที่คุณให้ไว้ มีแค่ทีมผู้พัฒนาเท่านั้นที่เห็น
        ใช้เพื่อติดตามผลการนอนของคุณ ไม่ส่งให้แพทย์โดยอัตโนมัติ คุณหยุดได้ทุกเมื่อ
      </p>

      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="text-sm text-zinc-500 underline text-left"
      >
        {expanded ? 'ซ่อนรายละเอียดการเก็บข้อมูล' : 'อ่านรายละเอียดการเก็บข้อมูล'}
      </button>

      {expanded && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-700 space-y-3">
          <div>
            <p className="font-medium">ใครเก็บข้อมูล</p>
            <p>ทีมผู้พัฒนาโครงการ CBT-I ติดต่อได้ที่ mingsupavit@gmail.com</p>
          </div>
          <div>
            <p className="font-medium">เก็บข้อมูลอะไรบ้าง</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>ชื่อบัญชีและอีเมล</li>
              <li>คำตอบในแบบประเมินนี้ รวมข้อมูลสุขภาพ เช่น อาการนอนไม่หลับ อารมณ์ โรคประจำตัว ส่วนสูง น้ำหนัก</li>
              <li>บันทึกการนอนที่คุณกรอกระหว่างโปรแกรม</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">ใครเห็นข้อมูล</p>
            <p>มีแค่ทีมผู้พัฒนาเท่านั้น ไม่ส่งให้แพทย์หรือคนอื่นโดยอัตโนมัติ ไม่ขาย ไม่ใช้โฆษณา</p>
          </div>
          <div>
            <p className="font-medium">เก็บนานแค่ไหน</p>
            <p>1 ปีนับจากวันที่คุณยินยอม แล้วลบทิ้ง</p>
          </div>
          <div>
            <p className="font-medium">สิทธิ์ของคุณ</p>
            <p>คุณขอดู ขอแก้ ขอลบ หรือถอนความยินยอมได้ทุกเมื่อ โดยติดต่อ mingsupavit@gmail.com</p>
          </div>
        </div>
      )}

      <form action={action} className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="consent"
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-zinc-900"
          />
          <span className="text-sm text-zinc-700 leading-relaxed">
            ฉันอ่านรายละเอียดแล้ว เข้าใจ และยินยอมให้เก็บและใช้ข้อมูลตามนั้น รวมถึงข้อมูลสุขภาพ
          </span>
        </label>

        {state?.error && (
          <p className="text-sm text-zinc-700 bg-zinc-100 rounded-lg px-4 py-3">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'กำลังโหลด…' : 'เริ่มแบบประเมิน'}
        </button>
      </form>
    </div>
  )
}
