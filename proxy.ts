import { NextResponse, type NextRequest } from 'next/server'
import { isGameKey } from '@/lib/games'
import { LOCALE_COOKIE, isLocale, matchLocale } from '@/lib/i18n'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const [, first, section, key, ...rest] = pathname.split('/')
  if (isLocale(first)) {
    // 모르는 게임 키는 부분 프리렌더된 게임 셸이 200으로 스트리밍을 시작하기
    // 전에 여기서 404로 보낸다.
    if (section === 'games' && key && !rest.length && !isGameKey(key)) {
      request.nextUrl.pathname = `/${first}/404`
      return NextResponse.rewrite(request.nextUrl)
    }
    return
  }

  // 방문자가 직접 고른 로케일이 브라우저 선호 언어보다 우선한다.
  const saved = request.cookies.get(LOCALE_COOKIE)?.value
  const locale = isLocale(saved)
    ? saved
    : matchLocale(request.headers.get('accept-language'))

  request.nextUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // Next 내부 경로, API 라우트, 파일처럼 보이는 경로는 건너뛴다.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
