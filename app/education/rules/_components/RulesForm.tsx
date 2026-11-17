'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { confirmRuleAction } from '@/app/education/rules/actions'
import SubmitButton from '@/app/assessment/_components/SubmitButton'

const RULES = [
  {
    n: 1,
    text: 'ตื่นเวลาเดิมทุกวัน ทั้งวันหยุด',
    whyLink: '/education/basics?tab=1&card=3',
    needsTargetTime: true,
  },
  {
    n: 2,
    text: 'ขึ้นเตียงเมื่อง่วงจริงๆ เท่านั้น (ตาหนัก หัวหงก) ไม่ใช่แค่เหนื่อย',
    whyLink: '/education/basics?tab=1&card=2',
    needsTargetTime: false,
  },
  {
    n: 3,
    text: 'ถ้านอนไม่หลับประมาณ 20 นาที ให้ลุกจากเตียง ทำอะไรสบายๆ ในที่มืดสลัว แล้วกลับมาเมื่อง่วง อย่าดูนาฬิกา',
    whyLink: '/education/basics?tab=1&card=4',
    needsTargetTime: false,
  },
  {
    n: 4,
    text: 'งดงีบ ถ้าจำเป็นต้องงีบ ให้งีบไม่เกิน 30 นาที และก่อน 15:00',
    whyLink: '/education/basics?tab=1&card=2',
    needsTargetTime: false,
  },
  {
    n: 5,
    text: 'เช้ารับแสง เย็นหรี่ไฟ รับแสงธรรมชาติหลังตื่น และหรี่ไฟประมาณ 30 นาทีก่อนนอน',
    whyLink: '/education/basics?tab=1&card=3',
    needsTargetTime: false,
  },
  {
    n: 6,
    text: 'ระวังคาเฟอีน แอลกอฮอล์ และนิโคติน หลีกเลี่ยงคาเฟอีนอย่างน้อย 6 ชม. ก่อนนอน แอลกอฮอล์ก่อน 4 ชม.',
    whyLink: '/education/basics?tab=1&card=2',
    needsTargetTime: false,
  },
]

interface Props {
  currentRule: number      // 1–6
  confirmedCount: number   // how many are already confirmed (for progress)
  existingTargetTime?: string | null
  isReadOnly?: boolean     // C4: "My rules" in read-only mode
}

export default function RulesForm({ currentRule, confirmedCount, existingTargetTime, isReadOnly }: Props) {
  const [state, action, pending] = useActionState<{ error?: string } | null, FormData>(
    confirmRuleAction,
    null
  )
  const rule = RULES[currentRule - 1]

  return (
    <div className="flex flex-col gap-6 p-4 max-w-sm mx-auto min-h-screen">
      {/* Progress */}
      <div className="flex gap-1">
        {RULES.map(r => (
          <div
            key={r.n}
            className={`flex-1 h-1 rounded-full ${r.n <= confirmedCount ? 'bg-indigo-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      <div className="text-xs text-gray-500 text-center">
        {isReadOnly ? 'กฎของโปรแกรม' : `ข้อ ${currentRule} จาก 6`}
      </div>

      {/* Intro (shown only on first rule and not read-only) */}
      {currentRule === 1 && !isReadOnly && (
        <p className="text-sm text-gray-600 leading-relaxed">
          6 กฎเหล่านี้คือโปรแกรมของคุณ ทำทุกวันแม้คืนไหนนอนได้ไม่ดี กด "ทำไม?" เพื่อดูวิธีทำงาน
        </p>
      )}

      {/* Rule card */}
      <div className="rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
        <div className="text-xs font-medium text-indigo-600">กฎข้อที่ {rule.n}</div>
        <p className="text-base font-medium text-gray-900 leading-relaxed">{rule.text}</p>
        <Link href={rule.whyLink} className="text-sm text-indigo-600 underline self-start">
          ทำไม?
        </Link>
      </div>

      {/* Rule 1: target wakeup time input (D6) */}
      {rule.needsTargetTime && !isReadOnly && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">เลือกเวลาตื่นที่จะรักษาไว้ทุกวัน</span>
          <input
            type="time"
            name="target_wakeup_time"
            form="rules-form"
            defaultValue={existingTargetTime ?? ''}
            className="rounded-lg border border-gray-300 p-3 text-base"
            required
          />
        </label>
      )}

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {isReadOnly ? (
        <div className="flex gap-2 mt-auto">
          {currentRule > 1 && (
            <Link
              href={`/education/rules?rule=${currentRule - 1}&readonly=1`}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-center text-gray-700"
            >
              ← ก่อนหน้า
            </Link>
          )}
          {currentRule < 6 && (
            <Link
              href={`/education/rules?rule=${currentRule + 1}&readonly=1`}
              className="flex-1 rounded-xl bg-indigo-600 text-white py-3 text-sm font-medium text-center"
            >
              ถัดไป →
            </Link>
          )}
          {currentRule === 6 && (
            <Link
              href="/"
              className="flex-1 rounded-xl bg-indigo-600 text-white py-3 text-sm font-medium text-center"
            >
              เสร็จ
            </Link>
          )}
        </div>
      ) : (
        <form id="rules-form" action={action} className="mt-auto">
          <input type="hidden" name="rule_number" value={currentRule} />
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
