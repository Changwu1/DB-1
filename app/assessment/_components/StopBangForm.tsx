'use client'

import { useActionState, useState } from 'react'
import { submitStopBang } from '../actions'

type Saved = {
  snore?: string | null; tired?: string | null; observed?: string | null
  hypertension?: boolean | null; heightCm?: number | null; weightKg?: number | null
  neckIn?: number | null; sex?: string | null; age?: number | null
}

export default function StopBangForm({ saved }: { saved?: Saved }) {
  const [state, action, pending] = useActionState(submitStopBang, undefined)
  const [neckUnknown, setNeckUnknown] = useState(saved?.neckIn == null)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">STOP-Bang</p>
        <h1 className="text-xl font-semibold text-zinc-900">สุขภาพการนอนและร่างกาย</h1>
      </div>

      <form action={action} className="space-y-5">
        {/* Hidden age for stop-bang calculation */}
        <input type="hidden" name="age" value={saved?.age ?? ''} />

        {/* Snore */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">คุณกรนดังจนคนอื่นได้ยินไหม?</p>
          <div className="flex gap-2">
            {[{ v: 'yes', l: 'ใช่' }, { v: 'no', l: 'ไม่ใช่' }, { v: 'unknown', l: 'ไม่รู้' }].map(({ v, l }) => (
              <label key={v} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-2 py-2.5 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                <input type="radio" name="stop_bang_snore" value={v} defaultChecked={saved?.snore === v} className="h-4 w-4 accent-indigo-600" />
                <span className="text-sm text-zinc-700">{l}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tired */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">คุณรู้สึกง่วงหรือเหนื่อยล้าในตอนกลางวันบ่อย ๆ ไหม แม้จะนอนแล้ว?</p>
          <div className="flex gap-2">
            {[{ v: 'yes', l: 'ใช่' }, { v: 'no', l: 'ไม่ใช่' }].map(({ v, l }) => (
              <label key={v} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                <input type="radio" name="stop_bang_tired" value={v} defaultChecked={saved?.tired === v} className="h-4 w-4 accent-indigo-600" />
                <span className="text-sm text-zinc-700">{l}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Observed */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">มีคนบอกว่าคุณหยุดหายใจขณะหลับไหม?</p>
          <div className="flex gap-2">
            {[{ v: 'yes', l: 'ใช่' }, { v: 'no', l: 'ไม่ใช่' }, { v: 'unknown', l: 'ไม่รู้' }].map(({ v, l }) => (
              <label key={v} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-2 py-2.5 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                <input type="radio" name="stop_bang_observed" value={v} defaultChecked={saved?.observed === v} className="h-4 w-4 accent-indigo-600" />
                <span className="text-sm text-zinc-700">{l}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hypertension */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">คุณมีความดันโลหิตสูงหรืออยู่ระหว่างรักษาไหม?</p>
          <div className="flex gap-2">
            {[{ v: 'yes', l: 'ใช่' }, { v: 'no', l: 'ไม่ใช่' }].map(({ v, l }) => (
              <label key={v} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                <input type="radio" name="hypertension" value={v} defaultChecked={saved?.hypertension === (v === 'yes')} className="h-4 w-4 accent-indigo-600" />
                <span className="text-sm text-zinc-700">{l}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Height + Weight */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="height_cm" className="text-sm font-medium text-zinc-700">ส่วนสูง (ซม.)</label>
            <input id="height_cm" name="height_cm" type="number" min={100} max={200} step={0.1} defaultValue={saved?.heightCm ?? ''} placeholder="เช่น 170" className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label htmlFor="weight_kg" className="text-sm font-medium text-zinc-700">น้ำหนัก (กก.)</label>
            <input id="weight_kg" name="weight_kg" type="number" min={30} max={250} step={0.1} defaultValue={saved?.weightKg ?? ''} placeholder="เช่น 65" className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Neck */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">รอบคอ (นิ้ว)</label>
          <p className="text-xs text-zinc-400">วัดรอบคอบริเวณกึ่งกลาง ตอบ "ไม่รู้" ได้</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="neck_unknown"
              value="1"
              checked={neckUnknown}
              onChange={e => setNeckUnknown(e.target.checked)}
              className="h-4 w-4 rounded accent-indigo-600"
            />
            <span className="text-sm text-zinc-500">ไม่รู้ / ไม่มีตลับวัด</span>
          </label>
          {!neckUnknown && (
            <input
              id="neck_circumference_in"
              name="neck_circumference_in"
              type="number"
              min={8}
              max={30}
              step={0.25}
              defaultValue={saved?.neckIn != null ? saved.neckIn : ''}
              placeholder="เช่น 14.5"
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Sex */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">เพศกำเนิด</p>
          <div className="flex gap-2">
            {[{ v: 'ชาย', l: 'ชาย' }, { v: 'หญิง', l: 'หญิง' }].map(({ v, l }) => (
              <label key={v} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                <input type="radio" name="biological_sex" value={v} defaultChecked={saved?.sex === v} className="h-4 w-4 accent-indigo-600" />
                <span className="text-sm text-zinc-700">{l}</span>
              </label>
            ))}
          </div>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'กำลังบันทึก…' : 'ถัดไป'}
        </button>
      </form>
    </div>
  )
}
