export const LOCALES = ['ko', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ko'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const isLocale = (value: string | undefined): value is Locale =>
  LOCALES.includes(value as Locale)

/** Accept-Language 헤더에서 지원하는 로케일 중 가장 알맞은 것을 고른다. */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.find((p) => p.trim().startsWith('q='))
      return {
        lang: tag.toLowerCase().split('-')[0],
        q: q ? Number(q.trim().slice(2)) || 0 : 1,
      }
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q)
  return (
    (ranked.find((entry) => isLocale(entry.lang))?.lang as Locale) ??
    DEFAULT_LOCALE
  )
}
