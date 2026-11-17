'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function CBTIContent() {
  return (
    <div className="space-y-5 text-sm text-stone-700 leading-relaxed">
      <section className="space-y-1.5">
        <h3 className="font-semibold text-stone-900">CBT-I คืออะไร?</h3>
        <p>
          CBT-I (Cognitive Behavioural Therapy for Insomnia) คือการบำบัดความคิดและพฤติกรรมเพื่อแก้อาการนอนไม่หลับ
          ไม่ต้องใช้ยา องค์กรการแพทย์ชั้นนำ เช่น American Academy of Sleep Medicine และ
          American College of Physicians แนะนำให้ลอง CBT-I เป็นวิธีแรก ก่อนใช้ยานอนหลับ
        </p>
      </section>

      <section className="space-y-1.5">
        <h3 className="font-semibold text-stone-900">ทำไมถึงได้ผล?</h3>
        <p>
          อาการนอนไม่หลับมักเริ่มจากเรื่องเครียดหรือช่วงชีวิตที่เปลี่ยนไป
          แต่สิ่งที่ทำให้มันอยู่ต่อเป็นเดือน ๆ มักเป็นนิสัยการนอนและความกังวลเรื่องการนอนที่สะสมมา
          CBT-I ปรับสองอย่างนี้โดยตรง ผลจึงอยู่ได้นาน แม้หยุดโปรแกรมไปแล้ว
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-stone-900">โปรแกรมนี้ทำอะไรบ้าง?</h3>
        <ul className="space-y-1.5">
          <li className="flex gap-2">
            <span className="text-indigo-500 font-medium shrink-0">สัปดาห์ที่ 1</span>
            <span>บันทึกการนอนทุกเช้า เพื่อดูรูปแบบการนอนจริงของคุณ</span>
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-500 font-medium shrink-0">สัปดาห์ที่ 2+</span>
            <span>ปรับเวลาอยู่บนเตียงให้ใกล้กับเวลาที่หลับจริง และใช้เตียงเพื่อการนอนเท่านั้น</span>
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-500 font-medium shrink-0">ตลอดโปรแกรม</span>
            <span>เรียนรู้เรื่องการนอนวันละนิด และฝึกจัดการความคิดที่ทำให้นอนไม่หลับ</span>
          </li>
        </ul>
      </section>

      <section className="space-y-1.5">
        <h3 className="font-semibold text-stone-900">คาดหวังอะไรได้บ้าง?</h3>
        <p>
          ช่วงแรกอาจรู้สึกง่วงกว่าเดิมเล็กน้อย ซึ่งเป็นเรื่องปกติ
          เพราะร่างกายกำลังสร้างแรงขับในการนอนใหม่
          หลายคนเริ่มเห็นผลชัดในสัปดาห์ที่ 3–4
          ช่วงที่ง่วงมาก ควรหลีกเลี่ยงการขับรถหรือใช้เครื่องจักร
        </p>
      </section>

      <section className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 space-y-2">
        <h3 className="font-semibold text-indigo-900">เพื่อให้โปรแกรมนี้ได้ผล</h3>
        <p className="text-indigo-800">คุณต้องทำ 2 สิ่งอย่างสม่ำเสมอตลอดโปรแกรม</p>
        <ul className="space-y-1.5 text-indigo-800">
          <li className="flex gap-2">
            <span className="font-medium shrink-0">1.</span>
            <span><span className="font-medium">ทำตามกฎ CBT-I</span> ที่อยู่ในส่วน "กฎ CBT-I ที่ต้องทำตาม" ของแอป กฎเหล่านี้คือแก่นหลักของโปรแกรม ถ้าข้ามกฎ ผลจะไม่เกิด</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium shrink-0">2.</span>
            <span><span className="font-medium">บันทึกไดอารีการนอนทุกเช้า</span> เพื่อให้แอปติดตามและปรับคำแนะนำให้ตรงกับการนอนจริงของคุณ</span>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-1.5">
        <h3 className="font-semibold text-amber-900">ควรปรึกษาแพทย์ก่อน ถ้าคุณ…</h3>
        <ul className="space-y-1 text-amber-800">
          <li>• นอนกรนดังหรือมีคนบอกว่าหยุดหายใจตอนหลับ</li>
          <li>• มีโรคลมชัก โรคไบโพลาร์ หรือกำลังตั้งครรภ์</li>
        </ul>
      </section>
    </div>
  )
}

export default function CBTICard() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <span className="text-indigo-600 font-bold text-sm">CBT-I</span>
        </div>
        <div className="flex-1 flex flex-col">
          <span className="font-semibold text-base text-stone-800">CBT-I คืออะไร?</span>
          <span className="text-stone-400 text-sm">รู้จักโปรแกรมนี้ก่อนเริ่ม</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-stone-100">
          <div className="pt-4">
            <CBTIContent />
          </div>
        </div>
      )}
    </div>
  )
}
