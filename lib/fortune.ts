/**
 * 오늘의 운세: 언어와 무관한 입력 모델과 샘플 운세 생성기.
 * 문구는 사전(`fortune.content`)에 있고, 여기서는 그 배열을 가리키는
 * 번호만 고른다(화면에서 배열 길이로 나눈 나머지를 쓴다).
 */

export type Profile = {
  year: string
  month: string
  day: string
  /** `HH`, `HH:MM`, 또는 빈 문자열 */
  time: string
  calendar: '' | 'solar' | 'lunar'
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

/** 빈칸마다 더해지는 정확도. 합이 100이다. */
export const PARTS: { key: PartKey; weight: number }[] = [
  { key: 'year', weight: 16 },
  { key: 'month', weight: 12 },
  { key: 'day', weight: 12 },
  { key: 'time', weight: 24 },
  { key: 'calendar', weight: 12 },
  { key: 'gender', weight: 12 },
  { key: 'name', weight: 12 },
]

export const DOMAIN_KEYS = ['money', 'love', 'health', 'work', 'rel'] as const
export type DomainKey = (typeof DOMAIN_KEYS)[number]

export const DIRECTION_CODES = [
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
] as const

export const yearOk = (p: Profile) =>
  p.year.length === 4 && +p.year >= 1900 && +p.year <= new Date().getFullYear()
export const monthOk = (p: Profile) => +p.month >= 1 && +p.month <= 12
export const dateValid = (p: Profile) => {
  if (!yearOk(p) || !monthOk(p) || +p.day < 1) return false
  return +p.day <= new Date(+p.year, +p.month, 0).getDate()
}
export const timeValid = (p: Profile) => {
  const m = p.time.match(/^(\d{1,2})(?::(\d{2}))?$/)
  return !!m && +m[1] < 24 && (!m[2] || +m[2] < 60)
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
      return timeValid(p)
    case 'name':
      return p.name.trim().length > 0
    default:
      return p[key] !== ''
  }
}

export const accuracy = (p: Profile) =>
  PARTS.reduce((sum, part) => sum + (partOk(p, part.key) ? part.weight : 0), 0)

/** 띠: 12지 배열(원숭이부터)의 번호 */
export const zodiacIndex = (year: number) => ((year % 12) + 12) % 12

const SIGN_LIMITS = [
  120, 219, 321, 420, 521, 621, 723, 823, 923, 1023, 1122, 1222,
]
/** 별자리: 염소자리부터 시작하는 12개 배열의 번호 */
export function signIndex(month: number, day: number) {
  const md = month * 100 + day
  const i = SIGN_LIMITS.findIndex((limit) => md < limit)
  return i === -1 ? 0 : i
}

/** 결정적 난수(xorshift). 같은 입력이면 같은 운세가 나온다. */
function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

export type DomainResult = {
  key: DomainKey
  score: number
  /** 사전의 `content.lines[key]`, `content.advice[key]`를 가리키는 번호 */
  line: number
  advice: number
}

export type Fortune = {
  total: number
  domains: DomainResult[]
  top: DomainKey
  low: DomainKey
  headline: number
  summary: number
  /** 두 시간 단위 12칸의 흐름 점수 */
  hours: number[]
  best: number
  direction: number
  accuracy: number
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** 샘플 운세. 실제 서비스에서는 여기만 바꾸면 된다. */
export function makeFortune(p: Profile): Fortune {
  const hour = timeValid(p) ? +p.time.split(':')[0] : 0
  const r = rng(
    +p.year * 10000 +
      +p.month * 100 +
      +p.day +
      hour * 7 +
      (p.gender === 'f' ? 3 : 0)
  )
  const pick = () => Math.floor(r() * 1000)
  const domains = DOMAIN_KEYS.map((key) => ({
    key,
    score: 50 + Math.round(r() * 45),
    line: pick(),
    advice: pick(),
  }))
  const total = Math.round(
    domains.reduce((a, d) => a + d.score, 0) / domains.length
  )
  const sorted = [...domains].sort((a, b) => b.score - a.score)
  const hours: number[] = []
  let v = total
  for (let i = 0; i < 12; i++) {
    v = clamp(v + Math.round((r() - 0.5) * 24), 35, 96)
    hours.push(v)
  }
  return {
    total,
    domains,
    top: sorted[0].key,
    low: sorted[sorted.length - 1].key,
    headline: pick(),
    summary: pick(),
    hours,
    best: hours.indexOf(Math.max(...hours)),
    direction: Math.floor(r() * DIRECTION_CODES.length),
    accuracy: accuracy(p),
  }
}
