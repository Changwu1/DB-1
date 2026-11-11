'use server'

import { revalidatePath } from 'next/cache'
import { dismissMyth as dismissMythDB } from '@/lib/education-db'

/** D4: dismiss the myth banner for today. */
export async function dismissMythAction(): Promise<void> {
  await dismissMythDB()
  revalidatePath('/')
}
