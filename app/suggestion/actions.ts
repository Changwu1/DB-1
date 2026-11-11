'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { saveSuggestionSelection } from '@/lib/suggestion-db'
import { getNowServer, toDateString } from '@/lib/time'

export interface SelectSuggestionsState {
  error?: string
}

/** R3: Save the user's 1–2 selected suggestions and start teaching period. */
export async function selectSuggestionsAction(
  _prev: SelectSuggestionsState,
  fd: FormData
): Promise<SelectSuggestionsState> {
  const selected = fd.getAll('selected') as string[]
  const weekNumber = Number(fd.get('weekNumber'))

  if (selected.length < 1 || selected.length > 2) {
    return { error: 'กรุณาเลือก 1–2 ข้อ' }
  }

  const now = await getNowServer()
  const today = toDateString(now)

  const { error } = await saveSuggestionSelection(weekNumber, selected, today)
  if (error) return { error }

  revalidatePath('/suggestion')
  redirect('/suggestion/done')
}
