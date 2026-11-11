import { redirect } from 'next/navigation'
import Link from 'next/link'
import { loadAssessment } from '@/lib/assessment-db'
import { beginProgramme } from './actions'

export default async function ResultPage() {
  const row = await loadAssessment()

  if (!row?.completed_at) {
    redirect('/assessment')
  }

  const result = row.result
  const flags = row.flags ?? []

  if (result === 'STOP') return <StopResult />
  if (result === 'REFER') return <ReferResult flags={flags} />
  if (result === 'NOT-FIT') return <NotFitResult />
  if (result === 'GO') return <GoResult flags={flags} />

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
        <p className="text-sm text-red-700">ลองติดต่อหมอ Surat หรือคลินิกที่คุณดูแลอยู่ได้เลย</p>
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

const REFER_REASONS: Record<string, string> = {
  ISI: 'อาการนอนไม่หลับของคุณค่อนข้างมาก ควรได้พบแพทย์โดยตรง',
  '9Q': 'คุณมีอาการด้านอารมณ์ที่ควรได้คุยกับแพทย์ก่อน',
  bipolar: 'การนอนน้อยลงอาจกระทบอาการของโรคอารมณ์สองขั้ว',
  psychosis: 'ยังไม่มีหลักฐานเพียงพอว่าโปรแกรมนี้ปลอดภัยสำหรับผู้ที่มีอาการทางจิต',
  epilepsy: 'การนอนน้อยลงอาจกระตุ้นอาการชักได้',
  parasomnia: 'ผู้ที่ละเมอควรให้แพทย์ประเมินก่อนปรับการนอน',
  machinery: 'ช่วงแรกที่ปรับการนอน อาจง่วงมากขึ้น เสี่ยงอุบัติเหตุในงานของคุณ',
  RLS: 'อาการที่ขาของคุณเข้าข่ายที่ควรให้แพทย์ประเมินก่อน',
  'STOP-Bang': 'คุณมีสัญญาณที่เข้าได้กับภาวะหยุดหายใจขณะหลับ ควรให้แพทย์ตรวจก่อน',
}

function ReferResult({ flags }: { flags: string[] }) {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-zinc-900">โปรแกรมนี้อาจยังไม่เหมาะกับคุณในตอนนี้</h1>
      <p className="text-sm text-zinc-600 leading-relaxed">
        จากคำตอบของคุณ การปรับพฤติกรรมการนอนแบบทำเองที่บ้านอาจยังไม่ปลอดภัยหรือยังไม่พอสำหรับคุณ
        นี่ไม่ใช่การวินิจฉัยโรค แค่เป็นข้อควรระวังเพื่อความปลอดภัยของคุณ
      </p>
      {flags.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-800 mb-2">เหตุผลที่เจอ</p>
          {flags.map(flag => (
            <p key={flag} className="text-sm text-amber-700">• {REFER_REASONS[flag] ?? flag}</p>
          ))}
        </div>
      )}
      <p className="text-sm text-zinc-600 leading-relaxed">
        เราแนะนำให้คุยกับหมอ Surat หรือแพทย์ที่ดูแลคุณก่อน แล้วค่อยตัดสินใจว่าจะทำโปรแกรมนี้ไหม
      </p>
    </div>
  )
}

function NotFitResult() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-zinc-900">ตอนนี้ปัญหาการนอนของคุณยังไม่เข้าเกณฑ์โปรแกรมนี้</h1>
      <p className="text-sm text-zinc-600 leading-relaxed">
        โปรแกรมนี้ออกแบบสำหรับคนที่นอนไม่หลับบ่อยและเป็นมาสักระยะแล้ว
        จากคำตอบของคุณยังไม่ตรงกับเกณฑ์ ซึ่งไม่ได้แปลว่าไม่มีอะไรเกิดขึ้น
      </p>
      <p className="text-sm text-zinc-600 leading-relaxed">
        ระหว่างนี้ลองอ่านเคล็ดลับการนอนทั่วไปได้เลย
        ถ้าอาการแย่ลงหรือเป็นถี่ขึ้น แนะนำให้คุยกับแพทย์
      </p>
      <Link
        href="/education/basics"
        className="rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white text-center"
      >
        ดูเคล็ดลับการนอน
      </Link>
    </div>
  )
}

const FLAG_MESSAGES: Record<string, { title: string; body: string }> = {
  'อารมณ์เศร้าระดับเล็กน้อย': {
    title: 'อารมณ์เศร้าระดับเล็กน้อย',
    body: 'คุณมีอาการด้านอารมณ์ระดับเล็กน้อย ถ้ารู้สึกแย่ลงระหว่างโปรแกรม บอกหมอ Surat นะ',
  },
  'เสี่ยงหยุดหายใจขณะหลับ': {
    title: 'เสี่ยงหยุดหายใจขณะหลับ',
    body: 'คุณมีความเสี่ยงภาวะหยุดหายใจขณะหลับ ควรแจ้งหมอ Surat',
  },
  'เสี่ยงหยุดหายใจขณะหลับ (มีบางข้อตอบว่าไม่รู้)': {
    title: 'เสี่ยงหยุดหายใจขณะหลับ',
    body: 'คุณมีความเสี่ยงภาวะหยุดหายใจขณะหลับ ควรแจ้งหมอ Surat มีบางข้อที่คุณตอบว่าไม่รู้ ผลนี้อาจต่ำกว่าความเป็นจริง',
  },
  'ทำงานเป็นกะ': {
    title: 'ทำงานเป็นกะ',
    body: 'คุณทำงานเป็นกะหรือเวลางานไม่แน่นอน เวลานอนอาจไม่คงที่ ควรแจ้งหมอ Surat',
  },
  'ตั้งครรภ์/หลังคลอด': {
    title: 'ตั้งครรภ์/หลังคลอด',
    body: 'คุณอยู่ในช่วงตั้งครรภ์หรือหลังคลอด ควรปรึกษาหมอ Surat ก่อนปรับการนอน',
  },
  'สิ่งช่วยหลับ': {
    title: 'สิ่งช่วยหลับ',
    body: 'คุณใช้ตัวช่วยให้หลับเป็นประจำ อย่าหยุดหรือเปลี่ยนเอง ปรึกษาหมอ Surat ก่อน',
  },
}

function GoResult({ flags }: { flags: string[] }) {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-zinc-900">คุณเหมาะกับโปรแกรมนี้ มาเริ่มกันเลย</h1>
      <p className="text-sm text-zinc-600 leading-relaxed">
        สัปดาห์แรก คุณจะจดบันทึกการนอนทุกเช้า (Sleep Diary) และอ่านเรื่องการนอนสั้น ๆ
        คำแนะนำปรับพฤติกรรมจะเริ่มในสัปดาห์ที่ 2 หลังเรามีข้อมูลการนอนของคุณแล้ว
      </p>
      {flags.length > 0 && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
          <p className="text-sm font-medium text-zinc-800">เรื่องที่ควรบอกหมอ Surat</p>
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
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white text-center"
        >
          เริ่มสัปดาห์ที่ 1
        </button>
      </form>
    </div>
  )
}
