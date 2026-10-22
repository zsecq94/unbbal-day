import Link from 'next/link'
import { ViewTransition } from 'react'
import { getDictionary, getLocale } from '@/app/[lang]/dictionaries'
import { LocaleSwitch } from '@/components/locale-switch'
import { LocaleText } from '@/components/locale-text'
import { Logo } from '@/components/logo'
import { hubPath } from '@/lib/routes'
import { BRAND_TRANSITION, NAV_BACK, SHARE_MORPH } from '@/lib/transitions'

/**
 * 허브 밖 모든 페이지 위에 놓이는 상단바: 돌아가는 길, 브랜드, 언어.
 * 로케일(루트 파라미터)만 읽으므로 공용 앱 셸에 속한다.
 */
export async function TopBar() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()])

  return (
    <header className="flex h-10 items-center gap-4 sm:gap-5">
      {/* scroll={false}: 허브가 스크롤 위치를 직접 되살려야 스테이지가
          방문자가 누른 타일로 다시 줄어든다. */}
      <Link
        href={hubPath(locale)}
        transitionTypes={[NAV_BACK]}
        scroll={false}
        aria-label={dict.nav.backLabel}
        className="inline-flex h-9 items-center gap-2.5 border border-line-strong px-3 text-ink-2 transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid motion-reduce:transition-none lit:border-ink lit:text-ink"
      >
        <span aria-hidden="true" className="font-mono text-sm">
          ←
        </span>
        <LocaleText name="back">
          <span className="text-[13px] font-bold">{dict.nav.back}</span>
        </LocaleText>
      </Link>

      <ViewTransition
        name={BRAND_TRANSITION}
        share={SHARE_MORPH}
        default="none"
      >
        <Logo name={dict.brand.name} />
      </ViewTransition>

      <span className="ml-auto">
        <LocaleSwitch current={locale} labels={dict.localeSwitch} />
      </span>
    </header>
  )
}
