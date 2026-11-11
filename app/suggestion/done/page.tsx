import Link from 'next/link'

export default function SuggestionDonePage() {
  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto p-6 flex flex-col gap-6">
      <p className="text-lg font-semibold text-gray-900 mt-8 text-center">
        ลองดูนะ เราเชียร์อยู่
      </p>
      <p className="text-sm text-gray-600 leading-relaxed text-center">
        ไม่ต้องสมบูรณ์แบบ ทำได้บ้างก็นับ บันทึกการนอนต่อไปเรื่อยๆ แล้วสัปดาห์หน้าจะรู้ว่าเป็นยังไงบ้าง
      </p>
      <Link
        href="/"
        className="rounded-xl bg-indigo-600 text-white py-3 text-center font-semibold text-sm"
      >
        กลับหน้าหลัก
      </Link>
    </main>
  )
}
