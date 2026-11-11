import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes accessible without auth
const PUBLIC_PATHS = ['/login', '/auth/callback']

// D8: routes each result can access (prefix match)
// Full per-screen enforcement lives in each layout/page once screens exist.
const RESULT_ALLOWED_PREFIXES: Record<string, string[]> = {
  GO: ['/'],
  'NOT-FIT': ['/assessment', '/education'],
  REFER: ['/assessment/result'],
  STOP: ['/assessment/result'],
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

  // D8: enforce result-based access for feature routes
  // Assessment and home are always reachable by authenticated users;
  // per-screen guards (Steps 4–8) enforce the full matrix within each route.
  const featureRoutes = ['/diary', '/education', '/suggestion', '/recap']
  if (featureRoutes.some(r => path.startsWith(r))) {
    const { data: assessment } = await supabase
      .from('assessment_responses')
      .select('result')
      .eq('user_id', user.id)
      .maybeSingle()

    const result = assessment?.result as keyof typeof RESULT_ALLOWED_PREFIXES | null

    if (result === 'STOP' || result === 'REFER') {
      const resultUrl = request.nextUrl.clone()
      resultUrl.pathname = '/assessment/result'
      return NextResponse.redirect(resultUrl)
    }

    if (result === 'NOT-FIT') {
      const allowed = RESULT_ALLOWED_PREFIXES['NOT-FIT']
      if (!allowed.some(prefix => path.startsWith(prefix))) {
        const resultUrl = request.nextUrl.clone()
        resultUrl.pathname = '/assessment/result'
        return NextResponse.redirect(resultUrl)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
