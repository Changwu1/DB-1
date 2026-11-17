'use client'

import { useEffect, useState } from 'react'
import { Moon } from 'lucide-react'

type Phase = 'show' | 'fadeout' | 'done'

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('show')
  const [logoVisible, setLogoVisible] = useState(false)
  const [textVisible, setTextVisible] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setLogoVisible(true), 80)
    const t1 = setTimeout(() => setTextVisible(true), 480)
    const t2 = setTimeout(() => setPhase('fadeout'), 1800)
    const t3 = setTimeout(() => setPhase('done'), 2350)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50"
      style={{
        opacity: phase === 'fadeout' ? 0 : 1,
        transition: phase === 'fadeout' ? 'opacity 550ms ease-out' : undefined,
      }}
    >
      {/* Logo */}
      <div
        style={{
          opacity: logoVisible ? 1 : 0,
          transform: logoVisible ? 'scale(1)' : 'scale(0.82)',
          transition: 'opacity 500ms ease-out, transform 500ms ease-out',
        }}
      >
        <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <Moon className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
      </div>

      {/* App name */}
      <div
        className="mt-7 flex flex-col items-center gap-1.5"
        style={{
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 650ms ease-out, transform 650ms ease-out',
        }}
      >
        <span className="text-xl font-semibold text-stone-900 tracking-tight">
          โปรแกรมปรับการนอน
        </span>
        <span className="text-sm text-stone-400">
          CBT-I สำหรับผู้มีปัญหานอนไม่หลับ
        </span>
      </div>
    </div>
  )
}
