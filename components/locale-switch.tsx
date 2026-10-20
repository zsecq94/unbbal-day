'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, LOCALE_COOKIE, type Locale } from '@/lib/i18n'

const ONE_YEAR = 60 * 60 * 24 * 365

export function LocaleSwitch({
  current,
  labels,
}: {
  current: Locale
  labels: { label: string } & Record<Locale, string>
}) {
  const pathname = usePathname()
  const hrefFor = (locale: Locale) =>
    pathname.replace(/^\/(ko|en)(?=\/|$)/, `/${locale}`) || `/${locale}`

  return (
    <nav aria-label={labels.label}>
      <ul className="flex items-center border border-line-strong font-mono text-[11px] tracking-[0.12em]">
        {LOCALES.map((locale) => {
          const active = locale === current
          return (
            <li key={locale}>
              <Link
                href={hrefFor(locale)}
                hrefLang={locale}
                lang={locale}
                aria-label={labels[locale]}
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR}; samesite=lax`
                }}
                className={`flex h-6 min-w-8 items-center justify-center px-2 uppercase transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid motion-reduce:transition-none ${
                  active ? 'bg-ink text-canvas' : 'text-ink-3 lit:text-ink'
                }`}
              >
                {locale}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
