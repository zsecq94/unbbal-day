import { NextResponse, type NextRequest } from 'next/server'
import { LOCALES, LOCALE_COOKIE, isLocale, matchLocale } from '@/lib/i18n'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )
  if (hasLocale) return

  // A locale the visitor picked explicitly wins over the browser preference.
  const saved = request.cookies.get(LOCALE_COOKIE)?.value
  const locale = isLocale(saved)
    ? saved
    : matchLocale(request.headers.get('accept-language'))

  request.nextUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // Skip Next internals, API routes and anything that looks like a file.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
