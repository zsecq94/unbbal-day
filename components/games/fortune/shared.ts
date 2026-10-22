import { useSyncExternalStore } from 'react'
import type { Dictionary } from '@/app/[lang]/dictionaries'

type Copy = Dictionary['fortune']

/** `{name}` 자리를 채운다. */
export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))

/** 0–24시를 사람 말로. */
export function hourLabel(copy: Copy, h: number) {
  if (h === 0 || h === 24) return copy.hours.midnight
  if (h === 12) return copy.hours.noon
  return fill(h < 12 ? copy.hours.am : copy.hours.pm, {
    h: h < 12 ? h : h - 12,
  })
}

/** 두 시간 단위 칸(0–11)의 범위. */
export const blockLabel = (copy: Copy, i: number) =>
  fill(copy.hours.range, {
    from: hourLabel(copy, i * 2),
    to: hourLabel(copy, i * 2 + 2),
  })

/** 받침 유무에 따라 조사를 고른다. 영어 사전은 둘 다 빈 문자열이다. */
export function particle(copy: Copy, word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code < 11172 && code % 28 !== 0
    ? copy.particles.final
    : copy.particles.open
}

const query = '(prefers-reduced-motion: reduce)'
const subscribe = (cb: () => void) => {
  const mq = matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
/** 동작 줄이기 설정. 서버와 첫 렌더에서는 꺼진 것으로 본다. */
export const useReducedMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false
  )
