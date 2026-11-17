'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Moon } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.updateUser({ password })

    if (authError) {
      setError(authError.message)
    } else {
      router.push('/')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center">
          <Moon className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-stone-900">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-stone-500 mt-0.5">กรอกรหัสผ่านใหม่ของคุณ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-stone-700">รหัสผ่านใหม่</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            required
            minLength={6}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-sm font-medium text-stone-700">ยืนยันรหัสผ่านใหม่</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            required
            minLength={6}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่านใหม่'}
        </button>
      </form>
    </div>
  )
}
