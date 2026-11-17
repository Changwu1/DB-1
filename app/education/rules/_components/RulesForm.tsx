'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { confirmSectionAction } from '@/app/education/rules/actions'
import SubmitButton from '@/app/assessment/_components/SubmitButton'
import { RULE_SECTIONS } from '@/lib/education'

const RULES: Record<number, { text: string; whyLink: string; needsTargetTime?: boolean }> = {
  1: {
    text: 'ตื่นเวลาเดิมทุกวัน ทั้งวันหยุด',
    whyLink: '/education/basics?tab=1&card=3',
    needsTargetTime: true,
  },
  2: {
    text: 'ขึ้นเตียงเมื่อง่วงจริง ๆ เท่านั้น (ตาหนัก หัวหงก) ไม่ใช่แค่เหนื่อย',
    whyLink: '/education/basics?tab=1&card=2',
  },
  3: {
    text: 'ถ้านอนไม่หลับประมาณ 20 นาที ให้ลุกจากเตียง ทำอะไรสบาย ๆ ในที่มืดสลัว แล้วกลับมาเมื่อง่วง อย่าดูนาฬิกา',
    whyLink: '/education/basics?tab=1&card=4',
  },
  4: {
    text: 'งดงีบ ถ้าจำเป็นต้องงีบ ให้งีบไม่เกิน 30 นาที และก่อน 15:00',
    whyLink: '/education/basics?tab=1&card=2',
  },
  5: {
    text: 'เช้ารับแสง เย็นหรี่ไฟ รับแสงธรรมชาติหลังตื่น และหรี่ไฟประมาณ 30 นาทีก่อนนอน',
    whyLink: '/education/basics?tab=1&card=3',
  },
  6: {
    text: 'ระวังคาเฟอีน แอลกอฮอล์ และนิโคติน หลีกเลี่ยงคาเฟอีนอย่างน้อย 6 ชม. ก่อนนอน แอลกอฮอล์ก่อน 4 ชม.',
    whyLink: '/education/basics?tab=1&card=2',
  },
}

interface Props {
  currentSection: number
  existingTargetTime?: string | null
  isReadOnly?: boolean
}

export default function RulesForm({ currentSection, existingTargetTime, isReadOnly }: Props) {
  const [state, action, pending] = useActionState<{ error?: string } | null, FormData>(
    confirmSectionAction,
    null
  )

  const section = RULE_SECTIONS.find(s => s.id === currentSection) ?? RULE_SECTIONS[0]
  const totalSections = RULE_SECTIONS.length

  return (
    <div className="flex flex-col gap-5 p-4 max-w-sm mx-auto min-h-screen">
      {/* Progress bar — tracks section number */}
      <div className="flex gap-1 pt-2">
        {RULE_SECTIONS.map(s => (
          <div
            key={s.id}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              s.id <= currentSection ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Section header */}
      <div>
        <p className="text-xs text-gray-500 mb-1">
          {isReadOnly ? 'กฎ CBT-I ที่ต้องทำตาม' : `ส่วนที่ ${currentSection} จาก ${totalSections}`}
        </p>
        <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
      </div>

      {/* Intro for first section, confirmation mode only */}
      {currentSection === 1 && !isReadOnly && (
        <p className="text-sm text-gray-600 leading-relaxed bg-indigo-50 rounded-xl px-4 py-3">
          กฎเหล่านี้คือแก่นหลักของโปรแกรม ทำทุกวันแม้คืนไหนนอนได้ไม่ดี กด "ทำไม?" เพื่อดูเหตุผล
        </p>
      )}

      {/* Rules in this section */}
      <div className="flex flex-col gap-3">
        {section.ruleNumbers.map(n => {
          const rule = RULES[n]
          return (
            <div key={n} className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  กฎข้อที่ {n}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 leading-relaxed">{rule.text}</p>
              <Link href={rule.whyLink} className="text-xs text-indigo-600 underline self-start">
                ทำไม?
              </Link>
            </div>
          )
        })}
      </div>

      {/* Target wakeup time (rule 1 is in section 1) */}
      {(section.ruleNumbers as readonly number[]).includes(1) && !isReadOnly && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-800">เลือกเวลาตื่นที่จะรักษาไว้ทุกวัน</span>
          <input
            type="time"
            name="target_wakeup_time"
            form="section-form"
            defaultValue={existingTargetTime ?? ''}
            className="rounded-xl border border-gray-300 p-3 text-base"
            required
          />
        </label>
      )}

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Navigation */}
      {isReadOnly ? (
        <div className="flex gap-2 mt-auto">
          {currentSection > 1 && (
            <Link
              href={`/education/rules?section=${currentSection - 1}&readonly=1`}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-center text-gray-700"
            >
              ← ก่อนหน้า
            </Link>
          )}
          {currentSection < totalSections ? (
            <Link
              href={`/education/rules?section=${currentSection + 1}&readonly=1`}
              className="flex-1 rounded-xl bg-indigo-600 text-white py-3 text-sm font-medium text-center"
            >
              ถัดไป →
            </Link>
          ) : (
            <Link
              href="/"
              className="flex-1 rounded-xl bg-indigo-600 text-white py-3 text-sm font-medium text-center"
            >
              เสร็จ
            </Link>
          )}
        </div>
      ) : (
        <form id="section-form" action={action} className="mt-auto">
          <input type="hidden" name="section_id" value={currentSection} />
          <SubmitButton
            pending={pending}
            label="ฉันจะทำตามนี้"
            className="w-full rounded-xl bg-indigo-600 text-white py-3 font-semibold text-base disabled:opacity-60"
          />
        </form>
      )}
    </div>
  )
}
