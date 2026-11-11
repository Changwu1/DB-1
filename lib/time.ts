declare global {
  // eslint-disable-next-line no-var
  var __DEV_DATE__: string | undefined
}

/** Single source of "now" for all date logic. Never call new Date() directly in feature code. */
export function getNow(): Date {
  if (process.env.NODE_ENV === 'development' && globalThis.__DEV_DATE__) {
    return new Date(globalThis.__DEV_DATE__)
  }
  return new Date()
}

/** Format a Date as YYYY-MM-DD in local time. */
export function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Add days to a date (returns new Date, does not mutate). */
export function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

/** Days elapsed between two dates (truncated to whole days). */
export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 86_400_000
  return Math.floor((to.getTime() - from.getTime()) / msPerDay)
}
