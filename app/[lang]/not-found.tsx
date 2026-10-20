import { PageTransition } from '@/components/page-transition'
import { TopBar } from '@/components/top-bar'
import { getDictionary, getLocale } from './dictionaries'

/** Rendered for `notFound()` anywhere under a locale, including the catch-all. */
export default async function NotFound() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()])

  return (
    <PageTransition>
      <main className="mx-auto flex min-h-dvh w-full max-w-[1920px] flex-col gap-3 px-4 py-4 sm:px-6 sm:py-6 xl:px-10 xl:py-10">
        <TopBar
          locale={locale}
          copy={{
            brand: dict.brand.name,
            ...dict.nav,
            localeSwitch: dict.localeSwitch,
          }}
        />
        <section
          aria-labelledby="not-found-title"
          className="flex flex-1 flex-col overflow-hidden rounded-tile border border-line bg-tile"
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-7 column-lines px-6 py-20 text-center sm:py-28">
            <span className="border border-line-strong px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] text-ink-3">
              404
            </span>
            <div className="flex flex-col items-center gap-3">
              <h1
                id="not-found-title"
                className="text-[clamp(1.625rem,2.4vw,2.375rem)] leading-tight font-[750] tracking-[-0.045em] break-keep"
              >
                {dict.notFound.title}
              </h1>
              <p className="max-w-[26rem] text-[15.5px] leading-[1.55] tracking-[-0.015em] break-keep text-ink-2 sm:text-base">
                {dict.notFound.body}
              </p>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  )
}
