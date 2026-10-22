import { useSyncExternalStore } from 'react'
import type { Dictionary } from '@/app/[lang]/dictionaries'
import type { Chart } from '@/lib/saju/chart'
import type { Pillar, TenGod } from '@/lib/saju/ganji'
import type { Reason } from '@/lib/saju/reading'

type Copy = Dictionary['fortune']

/** `{name}` 자리를 채운다. */
export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))

/** 하루 중 분을 `HH:MM`으로. */
const clock = (minutes: number) => {
  const m = (((minutes % 1440) + 1440) % 1440) | 0
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** 시진(0 = 자시)이 시작하는 벽시계 시각. `shift`는 태양시와 시계의 차이(분)다. */
export const blockClock = (i: number, shift: number) =>
  clock((23 + i * 2) * 60 + shift)

/** 시진 이름과 벽시계 범위. 범위의 줄표 뒤에서 줄이 갈리지 않게 단어 결합자를 붙인다. */
export const blockLabel = (copy: Copy, i: number, shift: number) =>
  fill(copy.hours.range, {
    name: copy.hours.names[i],
    from: blockClock(i, shift),
    to: `\u2060${blockClock(i + 1, shift)}`,
  })

/** 간지 한 쌍을 읽는 말로. */
export const ganji = (copy: Copy, p: Pillar) =>
  fill(copy.chart.ganji, { s: copy.stems[p.stem], b: copy.branches[p.branch] })

/** 사주 네 기둥. 시주를 모르면 그렇다고 적는다. */
export const pillarWords = (copy: Copy, chart: Chart) => [
  fill(copy.chart.year, { p: ganji(copy, chart.year) }),
  fill(copy.chart.month, { p: ganji(copy, chart.month) }),
  fill(copy.chart.day, { p: ganji(copy, chart.day) }),
  chart.hour
    ? fill(copy.chart.hour, { p: ganji(copy, chart.hour) })
    : copy.chart.noHour,
]

/** 일간을 오행과 함께. 예: 병화 */
export const dayMaster = (copy: Copy, chart: Chart) =>
  fill(copy.dayMaster, {
    stem: copy.stems[chart.day.stem],
    element: copy.elements[Math.floor(chart.day.stem / 2)],
  })

/** 점수의 근거를 말로. 십성이면 그 기운, 아니면 합충 같은 관계. */
export const reasonText = (copy: Copy, reason: Reason | TenGod) =>
  reason in copy.tenGods
    ? fill(copy.reasons.god, { god: copy.tenGods[reason as TenGod] })
    : copy.reasons[reason as Reason]

/** 받침 유무에 따라 조사를 고른다. 영어 사전은 둘 다 빈 문자열이다. */
export function particle(copy: Copy, word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code < 11172 && code % 28 !== 0
    ? copy.particles.final
    : copy.particles.open
}

/**
 * 글자가 잠깐 섞였다가 왼쪽부터 자리를 잡는다. 멈추는 함수를 돌려준다.
 * 공백과 보이지 않는 글자는 섞지 않아 낱말 모양이 유지된다.
 */
export function scramble(
  el: HTMLElement,
  text: string,
  { ms = 360, pool = '가나다라마바사아자차카타파하0123456789' } = {}
) {
  const t0 = performance.now()
  let raf = 0
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / ms)
    const n = Math.floor(text.length * k)
    el.textContent =
      text.slice(0, n) +
      [...text.slice(n)]
        .map((c) =>
          /[\s\u2060]/.test(c)
            ? c
            : pool[Math.floor(Math.random() * pool.length)]
        )
        .join('')
    if (k < 1) raf = requestAnimationFrame(step)
    else el.textContent = text
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
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
