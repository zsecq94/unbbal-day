import { ViewTransition } from 'react'
import { getDictionary, getLocale } from '@/app/[lang]/dictionaries'
import { LocaleSwitch } from '@/components/locale-switch'
import { LocaleText } from '@/components/locale-text'
import { Logo } from '@/components/logo'
import { TodayDate } from '@/components/today-date'
import { GAMES, SOLO_COUNT, TOGETHER_COUNT, pad2 } from '@/lib/games'
import { BRAND_TRANSITION, SHARE_MORPH } from '@/lib/transitions'

export async function Hero() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()])
  const { hero } = dict

  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex flex-col overflow-hidden rounded-tile border border-line bg-tile px-6 pt-6 pb-7 sm:px-10 sm:pt-[34px] sm:pb-9 md:col-span-12 xl:col-span-18 xl:row-span-2 fit:pt-[clamp(1.5rem,3.2vh,2.125rem)] fit:pb-[clamp(1.5rem,3.3vh,2.25rem)]"
    >
      {/* 데스크톱은 소개가 좁아 로고·날짜·언어가 한 줄에 다 들어가지 않는다.
          날짜를 로고 아래 줄로 내리고 언어 칩은 첫 줄 오른쪽에 둔다. */}
      <header className="flex items-center gap-3 xl:flex-wrap xl:gap-y-2.5 fit:mb-6">
        <ViewTransition
          name={BRAND_TRANSITION}
          share={SHARE_MORPH}
          default="none"
        >
          <Logo name={dict.brand.name} />
        </ViewTransition>
        <span className="ml-auto flex items-center gap-4 whitespace-nowrap xl:contents">
          <span className="hidden sm:inline xl:order-3 xl:basis-full">
            <TodayDate label={hero.today} />
          </span>
          <span className="xl:order-2 xl:ml-auto">
            <LocaleSwitch current={locale} labels={dict.localeSwitch} />
          </span>
        </span>
      </header>

      <LocaleText name="hero-title">
        <h1
          id="hero-title"
          className="mt-16 text-[clamp(2.75rem,4.4vw+0.25rem,5.625rem)] leading-[1.08] font-[800] tracking-[-0.05em] break-keep md:mt-24 fit:mt-auto [&:lang(en)]:tracking-[-0.04em]"
        >
          {hero.line1}
          <br />
          <span className="text-brand-hi">{hero.accent}</span>
          {hero.rest}
        </h1>
      </LocaleText>

      <LocaleText name="hero-sub">
        <p className="mt-6 text-[clamp(1.0625rem,1.05vw,1.25rem)] leading-[1.5] font-[450] tracking-[-0.015em] break-keep text-ink-2 fit:mt-[clamp(1rem,2.2vh,1.5rem)]">
          {hero.sub.map((part, i) =>
            typeof part === 'string' ? (
              part
            ) : (
              <b key={i} className="font-bold text-ink">
                {part.b}
              </b>
            )
          )}
        </p>
      </LocaleText>

      <LocaleText name="hero-counts">
        <dl className="mt-7 flex gap-7 border-t border-line-strong pt-5 font-mono text-xs tracking-[0.14em] text-ink-3 fit:mt-[clamp(1rem,2.6vh,1.75rem)] fit:pt-[clamp(0.875rem,1.9vh,1.25rem)]">
          {[
            [hero.counts.games, GAMES.length, false],
            [hero.counts.solo, SOLO_COUNT, true],
            [hero.counts.together, TOGETHER_COUNT, true],
          ].map(([label, count, korean]) => (
            <div key={String(label)} className="flex gap-2">
              <dt
                className={`order-2 ${korean && locale === 'ko' ? 'font-sans tracking-normal' : ''}`}
              >
                {label}
              </dt>
              <dd className="font-medium text-ink">{pad2(Number(count))}</dd>
            </div>
          ))}
        </dl>
      </LocaleText>
    </section>
  )
}
