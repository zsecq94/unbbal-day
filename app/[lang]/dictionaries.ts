import { notFound } from 'next/navigation'
import { lang } from 'next/root-params'
import { isLocale, type Locale } from '@/lib/i18n'
import type ko from './dictionaries/ko.json'

export type Dictionary = typeof ko

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ko: () => import('./dictionaries/ko.json').then((m) => m.default),
  en: () => import('./dictionaries/en.json').then((m) => m.default),
}

/** The locale of the current request, read from the root `[lang]` segment. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang()
  if (!isLocale(locale)) notFound()
  return locale
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]()
}
