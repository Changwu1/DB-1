import {
  MIN_DIARY_NIGHTS,
  EDUCATION_EFFICIENCY_THRESHOLD_PCT,
  EDUCATION_NAP_DAYS_THRESHOLD,
  EDUCATION_WAKE_RANGE_THRESHOLD_MIN,
  TOTAL_MYTHS,
} from './constants'

// ─── Why-it-continues cards (B rules) ────────────────────────────────────────
// D1: B5 ("Worry keeps the loop going") deleted — no assessment: สาเหตุเริ่มต้น
// D4: B4 ("Going to bed too early") disabled — no sleep window in MVP

export interface WhyCardsInput {
  nightsFilledIn: number
  daysNapped: number        // from weekly checklist
  wakeTimeRangeMins: number // max − min of final_wakeup times this week
  avgEfficiency: number     // weekly average sleep efficiency %
}

/**
 * Returns B-card IDs to show in weekly guidance (max 2).
 * Returns ['B6'] if no specific card matched or fewer than MIN_DIARY_NIGHTS.
 */
export function calcWhyCards(input: WhyCardsInput): string[] {
  const { nightsFilledIn, daysNapped, wakeTimeRangeMins, avgEfficiency } = input

  // B0: too few nights → skip B1–B5, show fallback (B5 deleted, D4 B4 disabled)
  if (nightsFilledIn < MIN_DIARY_NIGHTS) return ['B6']

  const cards: string[] = []
  // B1: naps ≥ threshold
  if (daysNapped >= EDUCATION_NAP_DAYS_THRESHOLD) cards.push('B1')
  // B2: wake-time range > threshold (strictly greater)
  if (wakeTimeRangeMins > EDUCATION_WAKE_RANGE_THRESHOLD_MIN) cards.push('B2')
  // B3: avg efficiency < threshold (strictly less)
  if (avgEfficiency < EDUCATION_EFFICIENCY_THRESHOLD_PCT) cards.push('B3')
  // B4 disabled (D4), B5 deleted (D1)

  if (cards.length === 0) return ['B6']
  return cards.slice(0, 2) // cap at 2
}

// ─── Myth of the day (D rules) ────────────────────────────────────────────────

export interface MythState {
  mythOrder: number[]          // remaining myths to show (first up next)
  mythToday: number | null     // myth shown today (1–9)
  mythShownDate: string | null // 'YYYY-MM-DD' — when mythToday was set
  mythHiddenToday: boolean     // user dismissed for today (D4)
  lastMythNumber: number | null // last myth shown (for reshuffle constraint)
}

export interface MythResult {
  mythNumber: number
  show: boolean
  newState: MythState
}

/** Default Fisher-Yates shuffle. */
function defaultShuffle(arr: number[]): number[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Returns the myth to show on `today` and the updated state.
 * Pass a deterministic `shuffleFn` for testing.
 */
export function pickMythOfDay(
  state: MythState,
  today: string,
  shuffleFn: (arr: number[]) => number[] = defaultShuffle
): MythResult {
  // D1: same day — keep showing current myth
  if (state.mythShownDate === today && state.mythToday !== null) {
    return { mythNumber: state.mythToday, show: !state.mythHiddenToday, newState: state }
  }

  // D3: phone date moved back — keep saved myth, don't advance
  if (state.mythShownDate && today < state.mythShownDate && state.mythToday !== null) {
    return { mythNumber: state.mythToday, show: !state.mythHiddenToday, newState: state }
  }

  // D2: new day (or first time) — advance to next myth
  let order = state.mythOrder.slice()

  if (order.length === 0) {
    // All myths shown (or first time) → reshuffle all 9
    let shuffled = shuffleFn(Array.from({ length: TOTAL_MYTHS }, (_, i) => i + 1))
    // Ensure first myth ≠ lastMythNumber
    if (state.lastMythNumber !== null && shuffled[0] === state.lastMythNumber && shuffled.length > 1) {
      // Swap first with second to satisfy the constraint
      ;[shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]]
    }
    order = shuffled
  }

  const mythNumber = order[0]
  const newOrder = order.slice(1)
  const newState: MythState = {
    mythOrder: newOrder,
    mythToday: mythNumber,
    mythShownDate: today,
    mythHiddenToday: false,
    lastMythNumber: mythNumber,
  }
  return { mythNumber, show: true, newState }
}

// ─── Rules confirmation (C rules) ────────────────────────────────────────────

/**
 * Returns the first unconfirmed rule number (1–6), or null if all confirmed.
 */
export function nextUnconfirmedRule(confirmedRules: number[]): number | null {
  for (let i = 1; i <= 6; i++) {
    if (!confirmedRules.includes(i)) return i
  }
  return null
}

// ─── Rule sections ────────────────────────────────────────────────────────────

export const RULE_SECTIONS = [
  {
    id: 1,
    title: 'จัดเวลานอน',
    description: 'กฎเกี่ยวกับเวลาเข้านอนและตื่น',
    ruleNumbers: [1, 2],
  },
  {
    id: 2,
    title: 'เมื่อนอนไม่หลับ',
    description: 'สิ่งที่ต้องทำเมื่อนอนไม่หลับ',
    ruleNumbers: [3],
  },
  {
    id: 3,
    title: 'นิสัยระหว่างวัน',
    description: 'นิสัยที่ส่งผลต่อการนอนช่วงกลางวัน',
    ruleNumbers: [4, 5, 6],
  },
] as const

export type RuleSection = typeof RULE_SECTIONS[number]

/** Returns the section id of the first incomplete section, or null if all done. */
export function nextUnconfirmedSection(confirmedRules: number[]): number | null {
  for (const section of RULE_SECTIONS) {
    if (!(section.ruleNumbers as readonly number[]).every(n => confirmedRules.includes(n))) {
      return section.id
    }
  }
  return null
}

// ─── Why? link map (A4) ──────────────────────────────────────────────────────

const RULE_WHY_LINK: Record<number, { tab: 1; card: number }> = {
  1: { tab: 1, card: 3 }, // body clock
  2: { tab: 1, card: 2 }, // sleep pressure
  3: { tab: 1, card: 4 }, // when they disagree
  4: { tab: 1, card: 2 }, // sleep pressure
  5: { tab: 1, card: 3 }, // body clock
  6: { tab: 1, card: 2 }, // sleep pressure
}

/** Returns which tab/card the "Why?" button on a given rule should open. */
export function getRuleWhyLink(ruleNumber: 1 | 2 | 3 | 4 | 5 | 6): { tab: 1; card: number } {
  return RULE_WHY_LINK[ruleNumber]
}
