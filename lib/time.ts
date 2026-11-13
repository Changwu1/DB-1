declare global {
  // eslint-disable-next-line no-var
  var __DEV_DATE__: string | undefined
}

/**
 * Pure: returns the override date if provided and valid, otherwise real Date.
 * No NODE_ENV guard — testable in any environment.
 * NODE_ENV safety lives in getNow() and getNowServer() (the entry points).
 */
export function getNowWithOverride(override?: string): Date {
  if (override) {
    const d = new Date(override)
    if (!isNaN(d.getTime())) return d
  }
  return new Date()
}

/** Client-side "now" — reads globalThis.__DEV_DATE__ set by DevPanel. Override only in development. */
export function getNow(): Date {
  if (process.env.NODE_ENV === 'development' && globalThis.__DEV_DATE__) {
    return getNowWithOverride(globalThis.__DEV_DATE__)
  }
  return new Date()
}

/**
 * Server-side "now" — reads __dev_date__ cookie so Server Components and
 * API routes honour the same simulated date as the browser.
 * Only call from Server Components / Route Handlers (requires next/headers).
 */
export async function getNowServer(): Promise<Date> {
  if (process.env.NODE_ENV === 'development') {
    const { cookies } = await import('next/headers')
    const override = (await cookies()).get('__dev_date__')?.value
    return getNowWithOverride(override)
  }
  const { connection } = await import('next/server')
  await connection()
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
