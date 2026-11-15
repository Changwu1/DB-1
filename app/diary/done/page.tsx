import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function DiaryDonePage() {
  return (
    <main className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-stone-900">บันทึกแล้ว</h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          ขอบคุณที่มาเล่าให้ฟังนะ<br />
          ข้อมูลนี้จะช่วยให้เราปรับโปรแกรมได้ดียิ่งขึ้น
        </p>
      </div>

      <Link
        href="/"
        className="rounded-xl bg-indigo-600 text-white py-3 px-10 font-semibold text-base"
      >
        กลับหน้าหลัก
      </Link>
    </main>
  )
}
