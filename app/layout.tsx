import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'
import DevPanel from '@/components/DevPanel'

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'โปรแกรมปรับพฤติกรรมการนอน CBT-I',
  description: 'โปรแกรม CBT-I สำหรับผู้ที่มีปัญหานอนไม่หลับ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50">
        <NextTopLoader color="#4F46E5" height={3} showSpinner={false} />
        {/* 380px mobile-first container */}
        <div className="mx-auto w-full max-w-[380px] flex flex-col min-h-screen">
          {children}
        </div>
        <DevPanel />
      </body>
    </html>
  )
}
