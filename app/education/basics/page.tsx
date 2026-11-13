export const instant = false

import { loadEducationState } from '@/lib/education-db'
import BasicsViewer from './_components/BasicsViewer'

interface Props {
  searchParams: Promise<{ tab?: string; card?: string }>
}

export default async function BasicsPage({ searchParams }: Props) {
  const params = await searchParams
  const eduState = await loadEducationState()

  // A3: resume at last-read card per tab; default to 1
  const savedCard1 = eduState?.last_card_tab1 ?? 1
  const savedCard2 = eduState?.last_card_tab2 ?? 1

  // A4: deep-link to specific card via ?tab=&card=
  const reqTab = params.tab === '2' ? 2 : 1
  const reqCard = parseInt(params.card ?? '0', 10)
  const initialTab: 1 | 2 = reqTab
  const initialCard = reqCard > 0 ? reqCard : (reqTab === 1 ? savedCard1 : savedCard2)

  return (
    <main className="h-dvh overflow-hidden">
      <BasicsViewer
        initialTab={initialTab}
        initialCard={initialCard}
        savedCard1={savedCard1}
        savedCard2={savedCard2}
      />
    </main>
  )
}
