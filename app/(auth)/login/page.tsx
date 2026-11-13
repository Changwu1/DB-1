'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    if (mode === 'signup') {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        setError(authError.message)
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else {
        router.push('/')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-6 py-12">
      {/* Tab toggle */}
      <div className="flex rounded-xl border border-zinc-200 overflow-hidden">
        <button
          type="button"
          onClick={() => { setMode('login'); setError('') }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'}`}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError('') }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'}`}
        >
          สมัครสมาชิก
        </button>
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

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'กำลังดำเนินการ…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </button>
      </form>
    </div>
  )
}
