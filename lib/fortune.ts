/**
 * 오늘의 운세: 언어와 무관한 입력 모델과 운세 계산.
 * 사주 원국(lib/saju)과 오늘의 일진을 맞춰 점수를 내고, 문구는 사전(`fortune.content`)에서
 * 근거(십성·점수 단계)에 맞는 묶음을 고른다. 같은 묶음 안의 문장은 날짜마다 돌아가며 쓴다.
 */

import { birthChart, todayOf, type Chart } from '@/lib/saju/chart'
import type { Pillar, TenGod } from '@/lib/saju/ganji'
import { lunarToSolar } from '@/lib/saju/lunar'
import { readDay, type DomainKey, type Reason } from '@/lib/saju/reading'

export type { DomainKey }

export type Profile = {
  year: string
  month: string
  day: string
  /** `HH`, `HH:MM`, 또는 빈 문자열 */
  time: string
  /** 비우면 양력으로 본다. `leap`은 음력 윤달. */
  calendar: '' | 'solar' | 'lunar' | 'leap'
  gender: '' | 'f' | 'm' | 'x'
  name: string
}

export const EMPTY_PROFILE: Profile = {
  year: '',
  month: '',
  day: '',
  time: '',
  calendar: '',
  gender: '',
  name: '',
}

export type PartKey = keyof Profile

/**
 * 빈칸마다 더해지는 정확도. 합이 100이다. 결과를 실제로 바꾸는 정도만큼 준다.
 * 시각은 시주를, 양음력은 날짜 자체를, 성별은 애정운의 기준 별을 정한다.
 * 이름은 사주에 쓰이지 않아 호칭으로만 쓴다.
 */
export const PARTS: { key: PartKey; weight: number }[] = [
  { key: 'year', weight: 20 },
  { key: 'month', weight: 20 },
  { key: 'day', weight: 20 },
  { key: 'time', weight: 24 },
  { key: 'calendar', weight: 8 },
  { key: 'gender', weight: 8 },
  { key: 'name', weight: 0 },
]

export const yearOk = (p: Profile) =>
  p.year.length === 4 && +p.year >= 1900 && +p.year <= new Date().getFullYear()
export const monthOk = (p: Profile) => +p.month >= 1 && +p.month <= 12

/** 입력한 날짜의 양력. 음력이면 바꾸고, 없는 날이면 null. */
export function solarDate(p: Profile) {
  if (!yearOk(p) || !monthOk(p) || +p.day < 1) return null
  const [y, m, d] = [+p.year, +p.month, +p.day]
  if (p.calendar === 'lunar' || p.calendar === 'leap')
    return lunarToSolar(y, m, d, p.calendar === 'leap')
  return d <= new Date(y, m, 0).getDate() ? { y, m, d } : null
}

/** 있는 날이고 오늘을 넘지 않는다 */
export const dateValid = (p: Profile) => {
  const s = solarDate(p)
  return !!s && new Date(s.y, s.m - 1, s.d) <= new Date()
}

const timeOf = (p: Profile) => {
  const m = p.time.match(/^(\d{1,2})(?::(\d{2}))?$/)
  if (!m || +m[1] > 23 || (m[2] && +m[2] > 59)) return null
  return { h: +m[1], min: m[2] ? +m[2] : 0 }
}
export function partOk(p: Profile, key: PartKey) {
  switch (key) {
    case 'year':
      return yearOk(p)
    case 'month':
      return monthOk(p)
    case 'day':
      return dateValid(p)
    case 'time':
      return timeOf(p) !== null
    case 'name':
      return p.name.trim().length > 0
    default:
      return p[key] !== ''
  }
}

export const accuracy = (p: Profile) =>
  PARTS.reduce((sum, part) => sum + (partOk(p, part.key) ? part.weight : 0), 0)

/** 사주 원국. 날짜가 아직 없으면 null. */
export function chartOf(p: Profile, birthZone: string) {
  const date = dateValid(p) && solarDate(p)
  return date ? birthChart(date, timeOf(p), birthZone) : null
}

/** 띠: 자(쥐)부터 센 12지 번호. 사주처럼 입춘에 바뀌므로 원국이 있으면 그 년지를 쓴다. */
export const zodiacIndex = (year: number, chart?: Chart | null) =>
  chart ? chart.year.branch : (((year - 4) % 12) + 12) % 12

const SIGN_LIMITS = [
  120, 219, 321, 420, 521, 621, 723, 823, 923, 1023, 1122, 1222,
]
/** 별자리: 양력 날짜로 본다. 염소자리부터 시작하는 12개 배열의 번호 */
export function signIndex(month: number, day: number) {
  const md = month * 100 + day
  const i = SIGN_LIMITS.findIndex((limit) => md < limit)
  return i === -1 ? 0 : i
}

/** FNV-1a. 같은 입력이면 같은 번호가 나온다. */
function hash(text: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export type Tone = 'good' | 'mid' | 'low'
export type Level = 'high' | 'mid' | 'low'

export type DomainResult = {
  key: DomainKey
  score: number
  level: Level
  /** 이 점수가 나온 가장 큰 이유 */
  reason: Reason | TenGod
  /** 그 이유가 점수를 올렸는가 */
  up: boolean
  /** 사전의 `content.lines[key][level]`, `content.advice[key][level]`를 가리키는 번호 */
  line: number
  advice: number
}

export type Fortune = {
  total: number
  tone: Tone
  /** 오늘 일진 천간이 일간에게 무엇인가 */
  tenGod: TenGod
  domains: DomainResult[]
  top: DomainKey
  low: DomainKey
  headline: number
  summary: number
  /** 자시부터 해시까지 열두 시진의 흐름 점수 */
  hours: number[]
  best: number
  /** 시진 경계가 벽시계로 밀리는 분 */
  shift: number
  /** 사전의 `content.lucky[yong]`을 가리키는 번호. 용신 오행의 색·맛·장소·활동 중 하나 */
  lucky: number
  /** 원국의 오행 개수(목화토금수, 월지는 2로 셈) */
  elements: number[]
  /** 가장 필요한 오행(용신) */
  yong: number
  accuracy: number
  chart: Chart
  today: Pillar
  /** 양력 생일(별자리용) */
  birth: { y: number; m: number; d: number }
}

const toneOf = (total: number): Tone =>
  total >= 64 ? 'good' : total >= 52 ? 'mid' : 'low'
const levelOf = (score: number): Level =>
  score >= 66 ? 'high' : score >= 50 ? 'mid' : 'low'

/**
 * 오늘의 운세. `zone`은 방문자의 시간대(오늘 날짜와 시진 경계),
 * `birthZone`은 태어난 곳의 시간대다. `now`를 비우면 지금으로 본다.
 */
export function makeFortune(
  p: Profile,
  {
    now = Date.now(),
    zone,
    birthZone,
  }: { now?: number; zone: string; birthZone: string }
): Fortune {
  const chart = chartOf(p, birthZone)!
  const today = todayOf(now, zone)
  const r = readDay(chart, today, p.gender)
  const sorted = [...r.domains].sort((a, b) => b.score - a.score)

  const key = [
    today.date.y,
    today.date.m,
    today.date.d,
    chart.year.stem,
    chart.year.branch,
    chart.month.stem,
    chart.day.stem,
    chart.day.branch,
    chart.hour?.branch ?? '-',
    p.gender,
  ].join('.')
  const pick = (slot: string) => hash(`${key}:${slot}`)

  return {
    total: r.total,
    tone: toneOf(r.total),
    tenGod: r.tenGod,
    domains: r.domains.map(({ up, down, ...d }) => {
      const level = levelOf(d.score)
      /* 근거는 점수 단계와 같은 쪽에서 고른다. 주의 단계가 아니면 올린 이유를 댄다. */
      const reason =
        (level === 'low' ? (down ?? up) : (up ?? down)) ?? 'favorable'
      return {
        ...d,
        level,
        reason,
        up: reason === up,
        line: pick(`${d.key}.line`),
        advice: pick(`${d.key}.advice`),
      }
    }),
    top: sorted[0].key,
    low: sorted[sorted.length - 1].key,
    headline: pick('headline'),
    summary: pick('summary'),
    hours: r.hours,
    best: r.best,
    shift: today.shift,
    lucky: pick('lucky'),
    elements: r.elements,
    yong: r.yong,
    accuracy: accuracy(p),
    chart,
    today: today.day,
    birth: solarDate(p)!,
  }
}
