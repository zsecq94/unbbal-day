/**
 * 로또 번호 뽑기: 화면에 넘기는 묶음.
 * 운세로 뽑기는 오늘의 운세와 같은 원국·일진·용신으로 상생 궤도를 걷는다.
 */

import { makeFortune, type Profile } from '@/lib/fortune'
import { orbit, type Orbit } from '@/lib/lotto/orbit'
import { todayOf } from '@/lib/saju/chart'

export {
  cellElement,
  HADO_DIGITS,
  PICK,
  startCell,
  TOTAL,
  type Move,
  type Orbit,
} from '@/lib/lotto/orbit'

export type LuckyDraw = {
  orbit: Orbit
  chart: ReturnType<typeof makeFortune>['chart']
  /** 오늘 일진 */
  today: ReturnType<typeof makeFortune>['today']
  /** 방문자 시간대의 오늘 날짜 */
  date: { y: number; m: number; d: number }
  yong: number
  /** 오늘 금전운 점수 */
  money: number
  /** 가장 좋은 시진(0 = 자시)과 시진 경계가 밀리는 분 */
  best: number
  shift: number
}

/** 원국 입력으로 오늘의 번호를 고른다. 같은 입력이면 같은 날에는 같은 번호다. */
export function luckyDraw(
  profile: Profile,
  zones: { now?: number; zone: string; birthZone: string }
): LuckyDraw {
  const now = zones.now ?? Date.now()
  const f = makeFortune(profile, { ...zones, now })
  return {
    orbit: orbit(f.chart, f.today, f.yong),
    chart: f.chart,
    today: f.today,
    date: todayOf(now, zones.zone).date,
    yong: f.yong,
    money: f.domains.find((d) => d.key === 'money')!.score,
    best: f.best,
    shift: f.shift,
  }
}

/** 로또 공 색: 실제 6/45 공의 번호대 색 */
export type BallTone = 'yellow' | 'blue' | 'red' | 'gray' | 'green'
export const ballTone = (n: number): BallTone =>
  n <= 10
    ? 'yellow'
    : n <= 20
      ? 'blue'
      : n <= 30
        ? 'red'
        : n <= 40
          ? 'gray'
          : 'green'

/** 서울 기준 다음 추첨일(토요일). 토요일 20시 판매 마감 뒤면 다음 주로 본다. */
export function nextDraw(now = Date.now()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  )
  const w = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    parts.weekday
  )
  let days = (6 - w + 7) % 7
  if (days === 0 && +parts.hour >= 20) days = 7
  const d = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day + days))
  return { m: d.getUTCMonth() + 1, d: d.getUTCDate(), days }
}
