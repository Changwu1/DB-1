'use server'

import { redirect } from 'next/navigation'
import { saveFinalISI } from '@/lib/assessment-db'

type SubmitState = { error: string } | undefined

export async function submitFinalISI(
  _prev: SubmitState,
  fd: FormData
): Promise<SubmitState> {
  const scores = ['isi_q1', 'isi_q2', 'isi_q3', 'isi_q4', 'isi_q5', 'isi_q6', 'isi_q7'].map(
    (k) => Number(fd.get(k))
  )

  if (scores.some(isNaN) || scores.some((s) => s < 0 || s > 4)) {
    return { error: 'กรุณาตอบทุกข้อ' }
  }

  const total = scores.reduce((a, b) => a + b, 0)
  const { error } = await saveFinalISI(total)
  if (error) return { error: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' }

  redirect('/final-isi/result')
}
