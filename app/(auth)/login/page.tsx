'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Moon } from 'lucide-react'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    if (mode === 'forgot') {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (authError) {
        setError(authError.message)
      } else {
        setResetSent(true)
      }
      setLoading(false)
      return
    }

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
    <div className="flex flex-1 flex-col justify-center gap-6 px-6 py-10">
      {/* Brand header */}
      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center">
          <Moon className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-stone-900">โปรแกรมปรับการนอน</h1>
          <p className="text-sm text-stone-500 mt-0.5">CBT-I สำหรับผู้มีปัญหานอนไม่หลับ</p>
        </div>
      </div>

      {/* Tab toggle — hidden in forgot mode */}
      {mode !== 'forgot' && (
        <div className="flex rounded-xl border border-stone-200 overflow-hidden p-1 bg-stone-100 gap-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-stone-500'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'signup'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-stone-500'
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>
      )}

      {/* Forgot password — success state */}
      {mode === 'forgot' && resetSent ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-800 text-center">
            ส่งลิงก์เข้าสู่ระบบไปที่ <span className="font-medium">{email}</span> แล้ว<br />
            กดลิงก์ในอีเมลเพื่อเข้าสู่ระบบโดยตรง
          </div>
          <button
            type="button"
            onClick={() => { setMode('login'); setResetSent(false); setError('') }}
            className="text-sm text-indigo-600 text-center"
          >
            กลับไปเข้าสู่ระบบ
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'forgot' && (
            <p className="text-sm text-stone-600 text-center">
              กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับเข้าสู่ระบบโดยตรงให้
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-stone-700">อีเมล</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-stone-700">รหัสผ่าน</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError('') }}
                    className="text-xs text-indigo-600"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                )}
              </div>
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
          )}

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
            {loading ? 'กำลังดำเนินการ…' : mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'signup' ? 'สมัครสมาชิก' : 'ส่งลิงก์เข้าสู่ระบบ'}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError('') }}
              className="text-sm text-stone-500 text-center"
            >
              กลับไปเข้าสู่ระบบ
            </button>
          )}
        </form>
      )}
    </div>
  )
}
