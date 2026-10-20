import Link from 'next/link'
import { ViewTransition } from 'react'
import { getDictionary, getLocale } from '@/app/[lang]/dictionaries'
import { LocaleSwitch } from '@/components/locale-switch'
import { Logo } from '@/components/logo'
import { hubPath } from '@/lib/routes'
import { BRAND_TRANSITION, NAV_BACK } from '@/lib/transitions'

/**
 * Chrome above any non-hub page: the way back, the brand, the language.
 * Reads only the locale (a root param), so it belongs to the shared app shell.
 */
export async function TopBar() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()])

  return (
    <header className="flex h-10 items-center gap-4 sm:gap-5">
      {/* scroll={false}: the hub restores its own scroll position so the
          stage shrinks back into the tile the visitor pressed. */}
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
        <span className="text-[13px] font-bold">{dict.nav.back}</span>
      </Link>

      <ViewTransition name={BRAND_TRANSITION} share="morph" default="none">
        <Logo name={dict.brand.name} />
      </ViewTransition>

      <span className="ml-auto">
        <LocaleSwitch current={locale} labels={dict.localeSwitch} />
      </span>
    </header>
  )
}
