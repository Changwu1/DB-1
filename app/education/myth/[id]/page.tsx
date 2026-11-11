import { notFound } from 'next/navigation'
import Link from 'next/link'

const MYTHS = [
  {
    id: 1,
    headline: 'ทุกคนต้องนอน 8 ชั่วโมง',
    fact: 'ผู้ใหญ่ต้องการ 7 ชั่วโมงขึ้นไป และปริมาณที่ต้องการก็แตกต่างกัน เป้าหมายคือตื่นมาแล้วรู้สึกพักผ่อนเพียงพอ',
  },
  {
    id: 2,
    headline: 'นอนชดเชยตอนวันหยุดได้',
    fact: 'สองวันไม่พอที่จะฟื้นฟู และการนอนดึกวันอาทิตย์ทำให้คืนวันอาทิตย์หลับยากขึ้น',
  },
  {
    id: 3,
    headline: 'ฉันชินกับการนอน 5–6 ชั่วโมงแล้ว',
    fact: 'จากการศึกษา คนที่นอน 4–6 ชั่วโมงนาน 14 คืนรู้สึกง่วงเพียงเล็กน้อย แต่ประสิทธิภาพลดลงมาก',
  },
  {
    id: 4,
    headline: 'ดูทีวีหรือเลื่อนมือถือช่วยให้หลับ',
    body: 'แสงและเสียงที่เปลี่ยนตลอดเวลารบกวนการนอน และการใช้จอบนเตียงสอนสมองว่าเตียงคือที่ตื่น',
    fact: 'แสงและเสียงที่เปลี่ยนตลอดเวลารบกวนการนอน และการใช้จอบนเตียงสอนสมองว่าเตียงคือที่ตื่น',
  },
  {
    id: 5,
    headline: 'นมอุ่นหรือชาสมุนไพรช่วยให้หลับ',
    fact: 'แทบไม่มีหลักฐานว่าเครื่องดื่มใดทำให้หลับโดยตรง กิจวัตรที่ผ่อนคลายก่อนนอนอาจช่วยได้ และชาบางชนิดมีคาเฟอีน',
  },
  {
    id: 6,
    headline: 'ตื่นกลางดึกแปลว่านอนไม่ดี',
    fact: 'การตื่นสั้นๆ เป็นเรื่องปกติ การอยู่เฉยๆ และไม่ดูนาฬิกามักทำให้หลับต่อได้',
  },
  {
    id: 7,
    headline: 'แอลกอฮอล์ช่วยให้หลับ',
    fact: 'อาจทำให้หลับได้เร็วขึ้น แต่การนอนหลังดื่มมักแตกเป็นชิ้นๆ หลีกเลี่ยงภายใน 4 ชั่วโมงก่อนนอน',
  },
  {
    id: 8,
    headline: 'นอนกรนไม่เป็นอันตราย',
    fact: 'การกรนบ่อยและดังอาจเป็นสัญญาณของภาวะหยุดหายใจขณะหลับ ซึ่งคำแนะนำการนอนทั่วไปไม่สามารถแก้ได้',
    hasButton: true,
    buttonText: 'ปรึกษาแพทย์',
  },
  {
    id: 9,
    headline: 'ยานอนหลับช่วยได้ดีที่สุด',
    fact: 'CBT-I โดยไม่ใช้ยาเป็นการรักษาแนะนำอันดับแรกสำหรับการนอนไม่หลับเรื้อรัง',
  },
]

interface Props {
  params: Promise<{ id: string }>
}

export default async function MythPage({ params }: Props) {
  const { id } = await params
  const myth = MYTHS.find(m => m.id === parseInt(id, 10))
  if (!myth) notFound()

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto p-6 flex flex-col gap-6">
      <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
      <h1 className="text-xl font-semibold text-gray-900">{myth.headline}</h1>
      <p className="text-sm text-gray-700 leading-relaxed">{myth.fact}</p>
      {myth.hasButton && (
        <a
          href="tel:1323"
          className="rounded-lg border border-indigo-300 py-2.5 px-4 text-sm font-medium text-indigo-700 text-center self-start"
        >
          {myth.buttonText}
        </a>
      )}
    </main>
  )
}
