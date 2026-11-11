'use client'

import { useActionState } from 'react'
import { submitAccount } from '../actions'

export default function AccountForm() {
  const [state, action, pending] = useActionState(submitAccount, undefined)

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10 max-w-md mx-auto">
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">บัญชี</p>
        <h1 className="text-xl font-semibold text-zinc-900">ตั้งชื่อบัญชีของคุณ</h1>
        <p className="text-sm text-zinc-500">ใช้เป็นชื่อเรียกในระบบ ชื่อเล่นก็ได้</p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="account_name" className="text-sm font-medium text-zinc-700">ชื่อบัญชี</label>
          <input
            id="account_name"
            name="account_name"
            type="text"
            maxLength={30}
            placeholder="เช่น น้องนอน"
            required
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <p className="text-xs text-zinc-400">1–30 ตัวอักษร</p>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'กำลังบันทึก…' : 'ถัดไป'}
        </button>
      </form>
    </div>
  )
}
