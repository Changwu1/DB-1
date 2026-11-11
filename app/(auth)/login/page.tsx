'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    setLoading(false)
    if (authError) {
      setError('อีเมลนี้ดูไม่ถูกต้อง ลองเช็กอีกครั้ง')
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <h1 className="text-xl font-semibold text-center">เช็กอีเมลของคุณ</h1>
        <p className="text-sm text-zinc-500 text-center leading-relaxed">
          เราส่งลิงก์เข้าสู่ระบบไปที่ <span className="font-medium text-zinc-800">{email}</span> แล้ว
          กดลิงก์ในอีเมลเพื่อเข้าสู่ระบบ
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="text-sm text-zinc-500">ใส่อีเมลเพื่อรับลิงก์เข้าสู่ระบบ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">อีเมล</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'กำลังส่ง…' : 'ส่งลิงก์เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  )
}
