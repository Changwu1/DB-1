import { redirect } from 'next/navigation'
import Link from 'next/link'
import { loadISIScores } from '@/lib/assessment-db'
import { calcISIChange, calcISIInterpretation } from '@/lib/final-isi'

const SEVERITY_LABEL: Record<string, string> = {
  none: 'ไม่มีอาการนอนไม่หลับที่มีนัยสำคัญ',
  subthreshold: 'นอนไม่หลับระดับต่ำกว่าเกณฑ์',
  moderate: 'นอนไม่หลับระดับปานกลาง',
  severe: 'นอนไม่หลับระดับรุนแรง',
}

export default async function FinalISIResultPage() {
  const scores = await loadISIScores()

  if (scores.final === null) redirect('/final-isi')

  // If initial ISI somehow unavailable, show final score only
  if (scores.initial === null) {
    const severity = calcISIInterpretation(scores.final)
    return (
      <main className="min-h-screen bg-white max-w-sm mx-auto p-6 flex flex-col gap-6">
        <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
        <h1 className="text-xl font-semibold text-zinc-900">ผลการประเมิน ISI</h1>
        <div className="rounded-xl bg-indigo-50 p-5 flex flex-col gap-2">
          <p className="text-sm text-zinc-500">คะแนน ISI ตอนนี้</p>
          <p className="text-4xl font-bold text-indigo-700">{scores.final}</p>
          <p className="text-sm text-zinc-700">{SEVERITY_LABEL[severity]}</p>
        </div>
        <Link href="/" className="rounded-xl bg-indigo-600 text-white py-3 text-center font-semibold text-sm">
          กลับหน้าหลัก
        </Link>
      </main>
    )
  }

  const result = calcISIChange(scores.initial, scores.final)

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto p-6 flex flex-col gap-6">
      <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
      <h1 className="text-xl font-semibold text-zinc-900">ผลการประเมิน ISI</h1>

      {/* Score comparison */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          <div className="p-4 flex flex-col gap-1">
            <p className="text-xs text-zinc-400">ก่อนเริ่มโปรแกรม</p>
            <p className="text-3xl font-bold text-zinc-700">{result.initialScore}</p>
            <p className="text-xs text-zinc-500">{SEVERITY_LABEL[result.initialSeverity]}</p>
          </div>
          <div className="p-4 flex flex-col gap-1">
            <p className="text-xs text-zinc-400">ตอนนี้</p>
            <p className="text-3xl font-bold text-indigo-700">{result.finalScore}</p>
            <p className="text-xs text-zinc-500">{SEVERITY_LABEL[result.finalSeverity]}</p>
          </div>
        </div>
      </div>

      {/* Change summary */}
      <div className="rounded-xl bg-indigo-50 p-5 flex flex-col gap-2">
        {result.diff < 0 ? (
          <>
            <p className="text-sm font-semibold text-indigo-800">
              คะแนนลดลง {Math.abs(result.diff)} คะแนน
            </p>
            {result.clinicallySignificant && (
              <p className="text-sm text-indigo-700">
                การเปลี่ยนแปลงนี้มีนัยสำคัญทางคลินิก — นั่นหมายความว่าการนอนของคุณดีขึ้นอย่างแท้จริง
              </p>
            )}
            {!result.clinicallySignificant && (
              <p className="text-sm text-indigo-700">
                มีการปรับปรุงแต่ยังไม่ถึงเกณฑ์นัยสำคัญทางคลินิก — ทำต่อไปนะ
              </p>
            )}
          </>
        ) : result.diff === 0 ? (
          <p className="text-sm font-semibold text-zinc-700">คะแนนเท่าเดิม</p>
        ) : (
          <p className="text-sm font-semibold text-zinc-700">
            คะแนนเพิ่มขึ้น {result.diff} คะแนน — ลองปรับพฤติกรรมการนอนต่อไปนะ
          </p>
        )}
      </div>

      <Link href="/" className="rounded-xl bg-indigo-600 text-white py-3 text-center font-semibold text-sm">
        กลับหน้าหลัก
      </Link>
    </main>
  )
}
