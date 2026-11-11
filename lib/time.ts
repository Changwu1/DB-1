declare global {
  // eslint-disable-next-line no-var
  var __DEV_DATE__: string | undefined
}

/** Core override logic — accepts override string directly, fully testable. */
export function getNowWithOverride(override?: string): Date {
  if (process.env.NODE_ENV === 'development' && override) {
    return new Date(override)
  }
  return new Date()
}

/** Client-side "now" — reads globalThis.__DEV_DATE__ set by DevPanel. */
export function getNow(): Date {
  return getNowWithOverride(globalThis.__DEV_DATE__)
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
