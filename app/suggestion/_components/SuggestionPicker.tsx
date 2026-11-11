'use client'

import { useActionState, useState } from 'react'
import { selectSuggestionsAction, type SelectSuggestionsState } from '@/app/suggestion/actions'
import type { SuggestionRenderStats } from '@/lib/suggestion-db'
import Link from 'next/link'

// ─── Message builders ─────────────────────────────────────────────────────────

const TITLES: Record<string, string> = {
  S1: 'ตื่นเวลาเดิม',
  S2: 'ลุกจากเตียงถ้าไม่หลับเกิน 20 นาที',
  S3: 'brain dump 5 นาทีก่อนปิดไฟ',
  S4: 'ระบุความคิดที่วนบ่อยที่สุด',
  S5: 'เลื่อนคาเฟอีนให้เร็วขึ้น',
  S6: 'เว้นแอลกอฮอล์ใกล้นอน',
  S7: 'งีบให้สั้นและไม่ดึก',
  S8: 'ขยับตัวเพิ่ม',
  S9: 'เว้นออกกำลังหนักก่อนนอน',
  S10: 'หรี่ไฟก่อนนอน',
}

function buildBody(
  id: string,
  stats: SuggestionRenderStats,
  s2AddScreen: boolean,
  s2AddClock: boolean,
): string {
  switch (id) {
    case 'S1':
      return `ช่วงที่ผ่านมาคุณลุกจากเตียงห่างกันได้ถึง ${Math.round(stats.outOfBedRangeMins)} นาที ลองเลือกเวลาลุกที่ทำได้จริงสักเวลา แล้วลุกเวลานั้นทุกวัน แม้วันหยุดก็ตาม ทำได้เท่าไหร่ก็นับ ไม่ต้องสมบูรณ์แบบ`
    case 'S2': {
      let body =
        'คืนที่นอนไม่หลับเป็นเรื่องที่เจอได้บ่อย ถ้ารู้สึกว่าผ่านไปประมาณ 20 นาทีแล้วยังไม่หลับ ลองลุกไปนั่งทำอะไรเบาๆ ในที่แสงสลัว แล้วกลับมาเตียงเมื่อรู้สึกง่วง เพื่อให้สมองจำว่าเตียงคือที่นอน'
      if (s2AddScreen) body += ' ลองเลี่ยงมือถือระหว่างนั้น'
      if (s2AddClock) body += ' ลองหันนาฬิกาออกไป'
      return body
    }
    case 'S3':
      return `สัปดาห์ที่ผ่านมาคุณใช้เวลาราว ${Math.round(stats.avgSleepOnsetMins)} นาทีกว่าจะหลับ ก่อนปิดไฟ ลองใช้เวลาราว 5 นาทีเขียนสิ่งที่ต้องทำพรุ่งนี้ลงกระดาษ แล้ววางไว้ ให้สมองได้พัก`
    case 'S4':
      return 'แบบฝึกเสริม (หลักฐานของท่านี้เดี่ยวๆ ยังจำกัด) ถ้าคืนไหนความคิดวนขึ้นมา ลองสังเกตว่ามันวนเรื่องอะไรบ่อยที่สุด แล้วบอกตัวเองว่า ฉันกำลังมีความคิดว่า… ไม่ต้องไล่ความคิดออก แค่รู้ทัน'
    case 'S5':
      return `สัปดาห์ที่ผ่านมามี ${stats.caffeineNearBedDays} วันที่คุณดื่มกาแฟ ชา หรือเครื่องดื่มชูกำลังภายใน 6 ชั่วโมงก่อนนอน คาเฟอีนอยู่ในร่างกายได้หลายชั่วโมง ลองเลื่อนแก้วสุดท้ายของวันให้เร็วขึ้นดู`
    case 'S6':
      return `ช่วง 4 ชั่วโมงก่อนนอนมี ${stats.alcoholNearBedDays} วันที่คุณดื่มแอลกอฮอล์ แม้จะช่วยให้หลับเร็วขึ้น แต่การนอนช่วงหลังของคืนมักสะดุดมากขึ้น ลองเว้นช่วงใกล้นอนดูนะ`
    case 'S7':
      return 'ถ้าต้องงีบ ลองให้สั้นและไม่เกินบ่ายต้นๆ เพื่อเก็บความง่วงไว้ให้กลางคืน'
    case 'S8':
      return `สัปดาห์ที่ผ่านมาคุณได้ขยับตัวหรือออกกำลังกาย ${stats.exerciseDays} วัน ลองขยับเพิ่มอีกสักวันสองวันตามที่ทำไหว`
    case 'S9':
      return 'ถ้าออกกำลังหนัก ลองเว้นอย่างน้อย 1 ชั่วโมงก่อนเข้านอน'
    case 'S10':
      return `สัปดาห์ที่ผ่านมามี ${stats.dimLightsDays} วันที่คุณหรี่ไฟก่อนนอน ลองหรี่ไฟในบ้านและทำอะไรเบาๆ ก่อนนอนสักพัก`
    default:
      return ''
  }
}

// D2: "ทำไม?" link only for S1, S2, S3, S4, S7
const WHY_LINKS: Record<string, { tab: number; card: number }> = {
  S1: { tab: 1, card: 3 },
  S2: { tab: 1, card: 2 },
  S3: { tab: 2, card: 4 },
  S4: { tab: 2, card: 4 },
  S7: { tab: 1, card: 2 },
}

const SAFETY_TEXTS: Record<string, string> = {
  SF1: 'มีหลายคืนที่คุณแทบไม่ได้หลับเลย อาการนี้ควรให้แพทย์ช่วยดู ลองนัดพบแพทย์หรือผู้เชี่ยวชาญด้านการนอนนะ',
  SF2: 'ช่วงนี้คุณนอนหลับได้น้อยมากต่อเนื่อง ควรปรึกษาแพทย์',
  SF3: 'การนอนของคุณยังแย่ค่อนข้างมาก การลองปรับพฤติกรรมอย่างเดียวอาจไม่พอ ลองปรึกษาแพทย์',
  SF4: 'ช่วงนี้การนอนแย่ลงกว่าตอนเริ่ม บางคนเป็นแบบนี้ได้ ลองทำต่ออีกสองสามวัน ถ้ายังไม่ดีขึ้นแนะนำให้ปรึกษาแพทย์',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  topThree: string[]
  safetyFlags: string[]
  s2AddScreen: boolean
  s2AddClock: boolean
  stats: SuggestionRenderStats
  weekNumber: number
  alreadySelected?: string[]
}

export default function SuggestionPicker({
  topThree,
  safetyFlags,
  s2AddScreen,
  s2AddClock,
  stats,
  weekNumber,
  alreadySelected = [],
}: Props) {
  const [selected, setSelected] = useState<string[]>(alreadySelected)
  const [state, action, pending] = useActionState<SelectSuggestionsState, FormData>(
    selectSuggestionsAction,
    {}
  )

  const isReadOnly = alreadySelected.length > 0

  function toggle(id: string) {
    if (isReadOnly) return
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 2 ? [...prev, id] : prev
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Safety messages (SF1–SF4) — not locked by D3 */}
      {safetyFlags.map(sf => (
        <div key={sf} className="rounded-xl bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800 leading-relaxed">{SAFETY_TEXTS[sf]}</p>
        </div>
      ))}

      {/* Suggestion cards */}
      {topThree.map(id => {
        const isSelected = selected.includes(id)
        const isDisabled = !isReadOnly && !isSelected && selected.length >= 2

        return (
          <div
            key={id}
            className={`rounded-xl border p-4 flex flex-col gap-2 transition-colors ${
              isSelected
                ? 'border-indigo-400 bg-indigo-50'
                : isDisabled
                  ? 'border-gray-200 bg-gray-50 opacity-50'
                  : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm text-gray-900">{TITLES[id]}</p>
              {WHY_LINKS[id] && (
                <Link
                  href={`/education/basics?tab=${WHY_LINKS[id].tab}&card=${WHY_LINKS[id].card}`}
                  className="text-xs text-indigo-600 whitespace-nowrap flex-shrink-0"
                >
                  ทำไม?
                </Link>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {buildBody(id, stats, s2AddScreen, s2AddClock)}
            </p>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => toggle(id)}
                disabled={isDisabled}
                className={`mt-1 self-start rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                {isSelected ? '✓ เลือกแล้ว' : 'เลือกข้อนี้'}
              </button>
            )}
          </div>
        )
      })}

      {/* Max selection tooltip */}
      {!isReadOnly && selected.length >= 2 && (
        <p className="text-xs text-gray-500 text-center">
          เลือกได้ไม่เกิน 2 ข้อ เพื่อให้ค่อยๆ เปลี่ยนได้ไม่หนักเกินไป
        </p>
      )}

      {/* Submit (hidden when already selected) */}
      {!isReadOnly && (
        <form action={action}>
          <input type="hidden" name="weekNumber" value={weekNumber} />
          {selected.map(id => (
            <input key={id} type="hidden" name="selected" value={id} />
          ))}
          {state.error && (
            <p className="text-xs text-red-600 mb-2">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={selected.length === 0 || pending}
            className="w-full rounded-xl bg-indigo-600 text-white py-3 font-semibold text-sm disabled:opacity-40"
          >
            เริ่มลองข้อนี้
          </button>
        </form>
      )}
    </div>
  )
}
