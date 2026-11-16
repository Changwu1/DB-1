'use client'

import { useTransition, useState } from 'react'
import SubmitButton from '@/app/assessment/_components/SubmitButton'
import { saveDiary, type DiaryActionState } from '@/app/diary/actions'
import type { DiaryRow } from '@/lib/diary-db'

interface Props {
  nightDate: string        // 'YYYY-MM-DD'
  displayDate: string      // "คืนวันจันทร์ 9 พ.ย."
  prefill?: DiaryRow | null
}

export default function DiaryForm({ nightDate, displayDate, prefill }: Props) {
  const [wakeupCount, setWakeupCount] = useState<number>(prefill?.wakeup_count ?? 0)
  const [sleepOnset, setSleepOnset] = useState<number>(prefill?.sleep_onset_min ?? 0)
  const [wakeupDuration, setWakeupDuration] = useState<number>(prefill?.wakeup_duration_min ?? 0)
  const [sleepQuality, setSleepQuality] = useState<number | null>(prefill?.sleep_quality ?? null)
  const [confirmed, setConfirmed] = useState<'D8' | 'D16' | null>(null)

  const [state, setState] = useState<DiaryActionState>(null)
  const [pending, startTransition] = useTransition()

  const errorFields = state?.status === 'error' ? (state.fields ?? []) : []
  const isConfirm = state?.status === 'confirm'

  function fieldError(name: string) {
    return errorFields.includes(name)
      ? 'border-red-500 bg-red-50'
      : 'border-gray-300'
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Read time inputs directly from the DOM via the form element —
    // the most reliable method across all browsers and mobile pickers.
    const fd = new FormData(e.currentTarget)
    fd.set('night_date', nightDate)
    fd.set('sleep_onset_min', String(sleepOnset))
    fd.set('wakeup_count', String(wakeupCount))
    fd.set('wakeup_duration_min', String(wakeupDuration))
    if (sleepQuality !== null) fd.set('sleep_quality', String(sleepQuality))
    if (confirmed) fd.set('confirmed', confirmed)
    // Pass client's local time for D15 — server runs UTC, only the browser
    // knows the user's actual local wall-clock time.
    const localNow = new Date()
    fd.set('now_mins', String(localNow.getHours() * 60 + localNow.getMinutes()))

    startTransition(async () => {
      const result = await saveDiary(state, fd)
      setState(result)
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 p-4">

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
          defaultValue={(prefill?.bedtime ?? '').slice(0, 5)}
          className={`rounded-lg border p-3 text-base ${fieldError('bedtime')}`}
        />
      </label>

      {/* Q2: Lights out */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">ตั้งใจเริ่มนอน (ปิดไฟ วางมือถือ) กี่โมง?</span>
        <input
          type="time"
          name="lights_out"
          defaultValue={(prefill?.lights_out ?? '').slice(0, 5)}
          className={`rounded-lg border p-3 text-base ${fieldError('lights_out')}`}
        />
      </label>

      {/* Q3: Sleep onset */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium">หลังจากนั้น กว่าจะหลับประมาณกี่นาที?</span>
          <span className="text-sm font-semibold text-indigo-600 tabular-nums">{sleepOnset === 120 ? '120+ นาที' : `${sleepOnset} นาที`}</span>
        </div>
        <input
          type="range"
          min={0} max={120} step={5}
          value={sleepOnset}
          onChange={e => setSleepOnset(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
      </div>

      {/* Q4: Wakeup count */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">ตื่นกลางดึกกี่ครั้ง (ไม่นับตอนตื่นเช้า)?</span>
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

      {/* Q5: Wakeup duration (shown only when wakeupCount > 0) */}
      {wakeupCount > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium">รวมแล้วตื่นอยู่ประมาณกี่นาที?</span>
            <span className="text-sm font-semibold text-indigo-600 tabular-nums">{wakeupDuration === 120 ? '120+ นาที' : `${wakeupDuration} นาที`}</span>
          </div>
          <input
            type="range"
            min={0} max={120} step={5}
            value={wakeupDuration}
            onChange={e => setWakeupDuration(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>
      )}

      {/* Q6: Final wakeup */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">เช้านี้ตื่นนอนจริง ๆ ตอนกี่โมง?</span>
        <input
          type="time"
          name="final_wakeup"
          defaultValue={(prefill?.final_wakeup ?? '').slice(0, 5)}
          className={`rounded-lg border p-3 text-base ${fieldError('final_wakeup')}`}
        />
      </label>

      {/* Q7: Out of bed */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">แล้วลุกจากเตียงกี่โมง?</span>
        <input
          type="time"
          name="out_of_bed"
          defaultValue={(prefill?.out_of_bed ?? '').slice(0, 5)}
          className={`rounded-lg border p-3 text-base ${fieldError('out_of_bed')}`}
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
            <button
              key={v}
              type="button"
              onClick={() => setSleepQuality(v)}
              className={`flex-1 flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium transition-colors
                ${sleepQuality === v
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : errorFields.includes('sleep_quality')
                    ? 'border-red-500 bg-red-50 text-gray-700'
                    : 'border-gray-300 text-gray-700'}`}
            >
              <span className="font-semibold">{v}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <SubmitButton
        pending={pending}
        label="บันทึก"
        className="rounded-xl bg-indigo-600 text-white py-3 font-semibold text-base disabled:opacity-60"
      />
    </form>
  )
}
