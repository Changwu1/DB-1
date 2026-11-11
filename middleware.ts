import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes accessible without auth (Supabase magic-link callback also needs to be public)
const PUBLIC_PATHS = ['/login', '/auth/callback']

// D8: known result values — anything outside this list is treated as unknown → fail closed
const VALID_RESULTS = ['STOP', 'REFER', 'NOT-FIT', 'GO'] as const
type AssessmentResult = typeof VALID_RESULTS[number]

// D8: routes blocked per result (prefix match).
// GO users are allowed everywhere; per-screen guards in Steps 4–8 enforce fine-grained rules.
const BLOCKED_FEATURE_PREFIXES: Record<AssessmentResult, string[]> = {
  GO: [],
  'NOT-FIT': ['/diary', '/suggestion', '/recap'],
  REFER: ['/diary', '/education', '/suggestion', '/recap', '/assessment/consent'],
  STOP: ['/diary', '/education', '/suggestion', '/recap', '/assessment/consent'],
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Allow public paths regardless of auth state
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return supabaseResponse
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // D8: enforce result-based access on feature routes.
  // Only query DB for routes that could be blocked — avoids a round-trip on every asset.
  const needsResultCheck = ['/diary', '/education', '/suggestion', '/recap', '/assessment/consent']
    .some(r => path.startsWith(r))

  if (needsResultCheck) {
    const { data: assessment, error: assessErr } = await supabase
      .from('assessment_responses')
      .select('result')
      .eq('user_id', user.id)
      .maybeSingle()

    // Fail closed: if the DB query fails, redirect STOP/REFER/unknown to result page
    // rather than allowing access — STOP is permanent and must never be bypassed.
    if (assessErr) {
      const resultUrl = request.nextUrl.clone()
      resultUrl.pathname = '/assessment/result'
      return NextResponse.redirect(resultUrl)
    }

    const rawResult = assessment?.result
    // Runtime-validate the result value — unknown values redirect rather than pass through
    const result: AssessmentResult | null =
      rawResult && (VALID_RESULTS as readonly string[]).includes(rawResult)
        ? (rawResult as AssessmentResult)
        : null

    if (result) {
      const blocked = BLOCKED_FEATURE_PREFIXES[result]
      if (blocked.some(prefix => path.startsWith(prefix))) {
        const resultUrl = request.nextUrl.clone()
        resultUrl.pathname = '/assessment/result'
        return NextResponse.redirect(resultUrl)
      }
    }
    // null result = assessment not completed yet → allow through; per-screen guards handle it
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
