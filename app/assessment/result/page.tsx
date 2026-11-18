export const instant = false

import { redirect } from 'next/navigation'
import { loadAssessment } from '@/lib/assessment-db'
import { beginProgramme } from './actions'
import FormSubmitButton from '@/app/_components/FormSubmitButton'
import { createClient } from '@/lib/supabase/server'
import { getNowServer } from '@/lib/time'
import { loadProgrammeStart, startProgramme } from '@/lib/diary-db'

export default async function ResultPage() {
  const row = await loadAssessment()

  if (!row?.completed_at) {
    redirect('/assessment')
  }

  const result = row.result
  const flags = row.flags ?? []

  if (result === 'STOP') return <StopResult />
  if (result === 'GO') return <GoResult flags={flags} />

  // NOT-FIT / REFER — auto-enroll and go straight to home, no warning page
  if (result === 'NOT-FIT' || result === 'REFER') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('assessment_responses').update({ opted_in: true }).eq('user_id', user.id)
    }
    const existing = await loadProgrammeStart()
    if (!existing) {
      const now = await getNowServer()
      await startProgramme(now.toISOString())
    }
    redirect('/')
  }

  // Fallback (shouldn't happen)
  redirect('/assessment')
}

function StopResult() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-zinc-900">ขอหยุดแบบประเมินไว้ตรงนี้ก่อนนะ</h1>
      <p className="text-sm text-zinc-700 leading-relaxed">
        ขอบคุณที่ตอบตรง ๆ เรื่องที่คุณรู้สึกตอนนี้สำคัญกว่าเรื่องการนอน คุณไม่ต้องรับมือคนเดียว
      </p>
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-2">
        <p className="text-sm font-medium text-red-800">โทรสายด่วนสุขภาพจิต 1323 (ฟรี 24 ชั่วโมง) ได้ทันที</p>
        <p className="text-sm text-red-700">ถ้าอยู่ในอันตรายหรือต้องการความช่วยเหลือฉุกเฉิน โทร 1669</p>
        <p className="text-sm text-red-700">ลองติดต่อแพทย์หรือคลินิกที่ดูแลคุณได้เลย</p>
      </div>
      <div className="flex gap-3">
        <a
          href="tel:1323"
          className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-medium text-white text-center"
        >
          โทร 1323
        </a>
        <a
          href="tel:1669"
          className="flex-1 rounded-lg border border-red-300 py-3 text-sm font-medium text-red-700 text-center"
        >
          โทร 1669
        </a>
      </div>
    </div>
  )
}

const FLAG_MESSAGES: Record<string, { title: string; body: string }> = {
  'อารมณ์เศร้าระดับเล็กน้อย': {
    title: 'อารมณ์เศร้าระดับเล็กน้อย',
    body: 'คุณมีอาการด้านอารมณ์ระดับเล็กน้อย ถ้ารู้สึกแย่ลงระหว่างโปรแกรม บอกแพทย์นะ',
  },
  'เสี่ยงหยุดหายใจขณะหลับ': {
    title: 'เสี่ยงหยุดหายใจขณะหลับ',
    body: 'คุณมีความเสี่ยงภาวะหยุดหายใจขณะหลับ ควรแจ้งแพทย์',
  },
  'เสี่ยงหยุดหายใจขณะหลับ (มีบางข้อตอบว่าไม่รู้)': {
    title: 'เสี่ยงหยุดหายใจขณะหลับ',
    body: 'คุณมีความเสี่ยงภาวะหยุดหายใจขณะหลับ ควรแจ้งแพทย์ มีบางข้อที่คุณตอบว่าไม่รู้ ผลนี้อาจต่ำกว่าความเป็นจริง',
  },
  'ทำงานเป็นกะ': {
    title: 'ทำงานเป็นกะ',
    body: 'คุณทำงานเป็นกะหรือเวลางานไม่แน่นอน เวลานอนอาจไม่คงที่ ควรแจ้งแพทย์',
  },
  'ตั้งครรภ์/หลังคลอด': {
    title: 'ตั้งครรภ์/หลังคลอด',
    body: 'คุณอยู่ในช่วงตั้งครรภ์หรือหลังคลอด ควรปรึกษาแพทย์ก่อนปรับการนอน',
  },
  'สิ่งช่วยหลับ': {
    title: 'สิ่งช่วยหลับ',
    body: 'คุณใช้ตัวช่วยให้หลับเป็นประจำ อย่าหยุดหรือเปลี่ยนเอง ปรึกษาแพทย์ก่อน',
  },
}

function GoResult({ flags }: { flags: string[] }) {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-zinc-900">คุณเหมาะกับโปรแกรมนี้ มาเริ่มกันเลย</h1>
      <p className="text-sm text-zinc-600 leading-relaxed">
        สัปดาห์แรก คุณจะบันทึกการนอนทุกเช้า และอ่านเรื่องการนอนสั้น ๆ
        คำแนะนำปรับพฤติกรรมจะเริ่มในสัปดาห์ที่ 2 หลังเรามีข้อมูลการนอนของคุณแล้ว
      </p>
      {flags.length > 0 && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
          <p className="text-sm font-medium text-zinc-800">เรื่องที่ควรบอกแพทย์</p>
          <p className="text-xs text-zinc-500">ข้อมูลนี้ไม่ได้ถูกส่งให้ใครอัตโนมัติ</p>
          {flags.map(flag => {
            const msg = FLAG_MESSAGES[flag]
            return msg ? (
              <div key={flag} className="border-t border-zinc-200 pt-3">
                <p className="text-sm font-medium text-zinc-700">{msg.title}</p>
                <p className="text-sm text-zinc-600 mt-1">{msg.body}</p>
              </div>
            ) : null
          })}
        </div>
      )}
      <form action={beginProgramme}>
        <FormSubmitButton
          label="เริ่มสัปดาห์ที่ 1"
          className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white text-center flex items-center justify-center gap-2 disabled:opacity-50"
        />
      </form>
    </div>
  )
}
