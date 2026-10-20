import { NextResponse, type NextRequest } from 'next/server'
import { isGameKey } from '@/lib/games'
import { LOCALE_COOKIE, isLocale, matchLocale } from '@/lib/i18n'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const [, first, section, key, ...rest] = pathname.split('/')
  if (isLocale(first)) {
    // Unknown game keys 404 here, before the partially prerendered game shell
    // starts streaming with a 200.
    if (section === 'games' && key && !rest.length && !isGameKey(key)) {
      request.nextUrl.pathname = `/${first}/404`
      return NextResponse.rewrite(request.nextUrl)
    }
    return
  }

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
