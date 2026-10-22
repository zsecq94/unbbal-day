import { notFound } from 'next/navigation'
import { lang } from 'next/root-params'
import { isLocale, type Locale } from '@/lib/i18n'
import type en from './dictionaries/en.json'
import type ko from './dictionaries/ko.json'

export type Dictionary = typeof ko

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
/** en.json의 키 구조가 ko.json과 다르면(특히 ko에 없는 키가 있으면) 여기서 타입 오류가 난다. */
export const dictionariesMatch: Same<typeof en, Dictionary> = true

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ko: () => import('./dictionaries/ko.json').then((m) => m.default),
  en: () => import('./dictionaries/en.json').then((m) => m.default),
}

/** 현재 요청의 로케일. 루트 `[lang]` 세그먼트에서 읽는다. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang()
  if (!isLocale(locale)) notFound()
  return locale
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]()
}
