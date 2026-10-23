import { LocaleText } from '@/components/locale-text'
import { PageFrame } from '@/components/page-frame'
import { PageTransition } from '@/components/page-transition'
import { TopBar } from '@/components/top-bar'
import { getDictionary } from './dictionaries'

/** 로케일 아래 어디서든(나머지 경로 포함) `notFound()`가 불리면 그려진다. */
export default async function NotFound() {
  const dict = await getDictionary()

  return (
    <PageTransition>
      <PageFrame>
        <TopBar />
        <section
          aria-labelledby="not-found-title"
          className="flex flex-1 flex-col overflow-hidden rounded-tile border border-line bg-tile"
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-7 column-lines px-6 py-20 text-center sm:py-28">
            <span className="border border-line-strong px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] text-ink-3">
              404
            </span>
            <LocaleText name="not-found" align="center">
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
            </LocaleText>
          </div>
        </section>
      </PageFrame>
    </PageTransition>
  )
}
