'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { saveLastCardAction } from '@/app/education/basics/actions'

const TAB1_CARDS = [
  {
    n: 1,
    title: 'สองระบบควบคุมการนอน',
    body: 'แรงกดดันการนอน (Sleep Pressure) บอกร่างกายว่าต้องการนอนแค่ไหน นาฬิกาชีวภาพบอกว่าเมื่อไหร่ นอนหลับดีเกิดขึ้นเมื่อทั้งสองสอดคล้องกัน',
  },
  {
    n: 2,
    title: 'แรงกดดันการนอน',
    body: 'ยิ่งตื่นนานยิ่งง่วง แรงกดดันสะสมตั้งแต่ตื่นและหายไประหว่างหลับ การงีบ คาเฟอีน และการขึ้นเตียงเร็วเกินไปล้วนลดแรงกดดันนี้',
  },
  {
    n: 3,
    title: 'นาฬิกาชีวภาพ',
    body: 'สมองมีนาฬิกาที่ทำงานราว 24 ชั่วโมง ปล่อย melatonin ตอนเย็นเพื่อส่งสัญญาณกลางคืน นาฬิกาจะเลื่อนถ้าไม่รีเซตทุกวัน ด้วยแสงยามเช้าและเวลาตื่นที่แน่นอน',
  },
  {
    n: 4,
    title: 'เมื่อทั้งสองขัดแย้งกัน',
    body: 'ขึ้นเตียงก่อนแรงกดดันสูงพอ ก็นอนไม่หลับ เปลี่ยนเวลาตื่นบ่อยๆ นาฬิกาก็งงว่ากลางคืนเริ่มเมื่อไหร่',
  },
  {
    n: 5,
    title: 'การนอนเป็นรอบ',
    body: 'แต่ละรอบใช้เวลาราว 90 นาที หลายรอบต่อคืน การนอนลึกอยู่ตอนต้น ใกล้เช้าการนอนจะเบาลงและตื่นสั้นๆ บ้างเป็นเรื่องปกติ',
  },
]

const TAB2_CARDS = [
  {
    n: 1,
    title: 'นอนไม่หลับไม่ใช่แค่คืนเดียว',
    body: 'หมายถึงมีปัญหาหลับยาก ตื่นกลางดึก หรือตื่นเร็วเกินไป แม้มีโอกาสนอน',
  },
  {
    n: 2,
    title: 'เมื่อไหร่ถึงเรียกว่านอนไม่หลับ',
    body: 'เกิดขึ้นอย่างน้อย 3 คืนต่อสัปดาห์ นาน 3 เดือนขึ้นไป และกระทบชีวิตประจำวัน',
  },
  {
    n: 3,
    title: 'บางคนเสี่ยงมากกว่า',
    body: 'อายุ สุขภาพ นิสัยวิตกกังวล หรือตารางชีวิตที่เข้มงวด ทำให้นอนไม่หลับเกิดขึ้นง่ายขึ้น แต่ไม่ได้เป็นสาเหตุโดยตรง',
  },
  {
    n: 4,
    title: 'มีอะไรมากระตุ้น',
    body: 'ความเครียด เจ็บป่วย ยาใหม่ หรือกิจวัตรเปลี่ยน ทำให้นอนไม่ค่อยหลับสักพัก คนส่วนใหญ่หายเองเมื่อผ่านไป ถ้าไม่หาย แปลว่ามีบางอย่างที่ยังคงทำให้มันอยู่ต่อ',
  },
]

interface Props {
  initialTab: 1 | 2
  initialCard: number
  savedCard1: number
  savedCard2: number
}

export default function BasicsViewer({ initialTab, initialCard, savedCard1, savedCard2 }: Props) {
  const [tab, setTab] = useState<1 | 2>(initialTab)
  const [cardIdx, setCardIdx] = useState(initialCard - 1) // 0-indexed

  const cards = tab === 1 ? TAB1_CARDS : TAB2_CARDS
  const card = cards[Math.min(cardIdx, cards.length - 1)]

  // A3: save last card when it changes
  useEffect(() => {
    saveLastCardAction(tab, cardIdx + 1)
  }, [tab, cardIdx])

  function goTo(tabN: 1 | 2, idx: number) {
    setTab(tabN)
    setCardIdx(Math.max(0, Math.min(idx, (tabN === 1 ? TAB1_CARDS : TAB2_CARDS).length - 1)))
  }

  return (
    <div className="flex flex-col h-dvh bg-white max-w-sm mx-auto">
      {/* Back link */}
      <div className="px-4 pt-4 pb-1">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-stone-500">
          ← กลับหน้าหลัก
        </Link>
      </div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {(['การนอนทำงานยังไง', 'นอนไม่หลับคืออะไร'] as const).map((label, i) => {
          const tabN = (i + 1) as 1 | 2
          return (
            <button
              key={tabN}
              onClick={() => goTo(tabN, tabN === 1 ? savedCard1 - 1 : savedCard2 - 1)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
                ${tab === tabN ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Card */}
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-auto">
        <div className="text-xs text-gray-400">{cardIdx + 1} / {cards.length}</div>
        <h2 className="text-xl font-semibold text-gray-900">{card.title}</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{card.body}</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 p-4 border-t border-gray-100">
        <button
          onClick={() => setCardIdx(c => Math.max(0, c - 1))}
          disabled={cardIdx === 0}
          className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-30"
        >
          ←
        </button>
        <button
          onClick={() => setCardIdx(c => Math.min(cards.length - 1, c + 1))}
          disabled={cardIdx === cards.length - 1}
          className="flex-1 rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-medium disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  )
}
