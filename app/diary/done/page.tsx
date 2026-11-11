import Link from 'next/link'

export default function DiaryDonePage() {
  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto flex flex-col items-center justify-center gap-6 p-6">
      <p className="text-center text-lg font-medium text-gray-800">
        บันทึกแล้ว ขอบคุณที่มาเล่าให้ฟังนะ
      </p>
      <Link
        href="/"
        className="rounded-xl bg-indigo-600 text-white py-3 px-8 font-semibold text-base"
      >
        กลับหน้าหลัก
      </Link>
    </main>
  )
}
