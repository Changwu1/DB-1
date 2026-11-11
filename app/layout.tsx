import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import DevPanel from '@/components/DevPanel'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'โปรแกรมปรับพฤติกรรมการนอน CBT-I',
  description: 'โปรแกรม CBT-I สำหรับผู้ที่มีปัญหานอนไม่หลับ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">
        {/* 380px mobile-first container */}
        <div className="mx-auto w-full max-w-[380px] flex flex-col min-h-screen">
          {children}
        </div>
        <DevPanel />
      </body>
    </html>
  )
}
