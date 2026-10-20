import Link from 'next/link'
import { ViewTransition } from 'react'
import { LocaleSwitch } from '@/components/locale-switch'
import { Logo } from '@/components/logo'
import type { Locale } from '@/lib/i18n'
import { hubPath } from '@/lib/routes'
import { BRAND_TRANSITION, NAV_BACK } from '@/lib/transitions'

export type TopBarCopy = {
  brand: string
  back: string
  backLabel: string
  localeSwitch: { label: string } & Record<Locale, string>
}

/** Chrome above any non-hub page: the way back, the brand, the language. */
export function TopBar({ locale, copy }: { locale: Locale; copy: TopBarCopy }) {
  return (
    <header className="flex h-10 items-center gap-4 sm:gap-5">
      {/* scroll={false}: the hub restores its own scroll position so the
          stage shrinks back into the tile the visitor pressed. */}
      <Link
        href={hubPath(locale)}
        transitionTypes={[NAV_BACK]}
        scroll={false}
        aria-label={copy.backLabel}
        className="inline-flex h-9 items-center gap-2.5 border border-line-strong px-3 text-ink-2 transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid motion-reduce:transition-none lit:border-ink lit:text-ink"
      >
        <span aria-hidden="true" className="font-mono text-sm">
          ←
        </span>
        <span className="text-[13px] font-bold">{copy.back}</span>
      </Link>

      <ViewTransition name={BRAND_TRANSITION} share="morph" default="none">
        <Logo name={copy.brand} />
      </ViewTransition>

      <span className="ml-auto">
        <LocaleSwitch current={locale} labels={copy.localeSwitch} />
      </span>
    </header>
  )
}
