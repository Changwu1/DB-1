'use client'

import { useActionState, useState } from 'react'
import { saveDiary, type DiaryActionState } from '@/app/diary/actions'
import type { DiaryRow } from '@/lib/diary-db'

interface Props {
  nightDate: string        // 'YYYY-MM-DD'
  displayDate: string      // "คืนวันจันทร์ 9 พ.ย."
  prefill?: DiaryRow | null
}

export default function DiaryForm({ nightDate, displayDate, prefill }: Props) {
  const [state, action, pending] = useActionState<DiaryActionState, FormData>(saveDiary, null)

  const [wakeupCount, setWakeupCount] = useState<number>(prefill?.wakeup_count ?? 0)
  const [confirmed, setConfirmed] = useState<'D8' | 'D16' | null>(null)

  const errorFields = state?.status === 'error' ? (state.fields ?? []) : []
  const isConfirm = state?.status === 'confirm'

  function fieldError(name: string) {
    return errorFields.includes(name)
      ? 'border-red-500 bg-red-50'
      : 'border-gray-300'
  }

  return (
    <form action={action} className="flex flex-col gap-6 p-4">
      <input type="hidden" name="night_date" value={nightDate} />
      {confirmed && <input type="hidden" name="confirmed" value={confirmed} />}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-lg font-semibold">บันทึกการนอน</h1>
        <p className="text-sm text-gray-500 mt-1">{displayDate}</p>
      </div>

      {/* Error banner */}
      {state?.status === 'error' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* D8 / D16 confirm dialog */}
      {isConfirm && (
        <div className="rounded-lg bg-amber-50 border border-amber-300 p-4 text-sm">
          <p className="font-medium text-amber-800 mb-3">{state.message}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmed(state.type)}
              className="flex-1 rounded-lg bg-amber-500 text-white py-2 font-medium"
            >
              ถูกแล้ว
            </button>
            <button
              type="button"
              onClick={() => setConfirmed(null)}
              className="flex-1 rounded-lg border border-amber-400 text-amber-700 py-2 font-medium"
            >
              แก้เวลา
            </button>
          </div>
        </div>
      )}

      {/* Q1: Bedtime */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">เมื่อคืนคุณขึ้นเตียงกี่โมง?</span>
        <input
          type="time"
          name="bedtime"
          defaultValue={prefill?.bedtime ?? ''}
          className={`rounded-lg border p-3 text-base ${fieldError('bedtime')}`}
          required
        />
      </label>

      {/* Q2: Lights out */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">ตั้งใจเริ่มนอน (ปิดไฟ วางมือถือ) กี่โมง?</span>
        <input
          type="time"
          name="lights_out"
          defaultValue={prefill?.lights_out ?? ''}
          className={`rounded-lg border p-3 text-base ${fieldError('lights_out')}`}
          required
        />
      </label>

      {/* Q3: Sleep onset */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">หลังจากนั้น กว่าจะหลับประมาณกี่นาที?</span>
        <div className="flex items-center gap-3">
          <input
            type="range"
            name="sleep_onset_min"
            min={0}
            max={120}
            step={5}
            defaultValue={prefill?.sleep_onset_min ?? 0}
            className="flex-1 accent-indigo-600"
          />
        </div>
      </div>

      {/* Q4: Wakeup count */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">ตื่นกลางดึกกี่ครั้ง (ไม่นับตอนตื่นเช้า)?</span>
        <input type="hidden" name="wakeup_count" value={wakeupCount} />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setWakeupCount(n)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors
                ${wakeupCount === n
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-300 text-gray-700'}`}
            >
              {n === 3 ? '3 ขึ้นไป' : n}
            </button>
          ))}
        </div>
      </div>

      {/* Q5: Wakeup duration (shown only when wakeupCount > 0, D1) */}
      {wakeupCount > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">รวมแล้วตื่นอยู่ประมาณกี่นาที?</span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              name="wakeup_duration_min"
              min={0}
              max={600}
              step={5}
              defaultValue={prefill?.wakeup_duration_min ?? 0}
              className="flex-1 accent-indigo-600"
            />
          </div>
        </div>
      )}

      {/* Q6: Final wakeup */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">เช้านี้ตื่นครั้งสุดท้ายกี่โมง?</span>
        <input
          type="time"
          name="final_wakeup"
          defaultValue={prefill?.final_wakeup ?? ''}
          className={`rounded-lg border p-3 text-base ${fieldError('final_wakeup')}`}
          required
        />
      </label>

      {/* Q7: Out of bed */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">แล้วลุกจากเตียงกี่โมง?</span>
        <input
          type="time"
          name="out_of_bed"
          defaultValue={prefill?.out_of_bed ?? ''}
          className={`rounded-lg border p-3 text-base ${fieldError('out_of_bed')}`}
          required
        />
      </label>

      {/* Q8: Sleep quality */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">โดยรวมเมื่อคืนนอนเป็นอย่างไร?</span>
        <div className="flex gap-2">
          {[
            { v: 1, label: 'ไม่ดีเลย' },
            { v: 2, label: 'ไม่ค่อยดี' },
            { v: 3, label: 'พอใช้' },
            { v: 4, label: 'ดี' },
            { v: 5, label: 'ดีมาก' },
          ].map(({ v, label }) => (
            <label
              key={v}
              className={`flex-1 flex flex-col items-center gap-1 rounded-lg border py-2 text-xs cursor-pointer
                has-[:checked]:bg-indigo-600 has-[:checked]:border-indigo-600 has-[:checked]:text-white
                ${fieldError('sleep_quality')}`}
            >
              <input
                type="radio"
                name="sleep_quality"
                value={v}
                defaultChecked={prefill?.sleep_quality === v}
                className="sr-only"
              />
              <span className="font-semibold">{v}</span>
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-indigo-600 text-white py-3 font-semibold text-base disabled:opacity-60"
      >
        {pending ? 'กำลังบันทึก…' : 'บันทึก'}
      </button>
    </form>
  )
}
