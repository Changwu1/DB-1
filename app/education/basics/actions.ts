'use server'

import { saveLastCard } from '@/lib/education-db'

/** Persist the last-read card position for a tab (A3). */
export async function saveLastCardAction(tab: 1 | 2, card: number): Promise<void> {
  await saveLastCard(tab, card)
}
