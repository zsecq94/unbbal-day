import {
  dayPillarOfJdn,
  hourPillar,
  jdnOf,
  monthPillar,
  pillarAt,
  type Pillar,
} from '@/lib/saju/ganji'
import { termAt, termBetween } from '@/lib/saju/terms'
import {
  solarOffset,
  wallAt,
  wallToUtc,
  zoneOffset,
  type Wall,
} from '@/lib/saju/time'

export type Chart = {
  year: Pillar
  month: Pillar
  day: Pillar
  /** 태어난 시각을 모르면 null */
  hour: Pillar | null
  /** 시각 없이 절입일에 태어나 해·달 기둥이 바뀔 수 있다 */
  termEdge: boolean
}

/** 해와 달 기둥은 절입 시각으로 정한다. */
function yearMonth(utcMs: number) {
  const t = termAt(utcMs)
  const year = pillarAt(t.sajuYear - 4)
  return { year, month: monthPillar(year.stem, t.monthBranch) }
}

/** 태양시 벽시계로 날과 시 기둥. 23시(자시)부터 다음 날로 본다. */
function dayHour(solar: Wall) {
  const jdn = jdnOf(solar.y, solar.m, solar.d) + (solar.h >= 23 ? 1 : 0)
  const day = dayPillarOfJdn(jdn)
  return { day, hour: hourPillar(day.stem, Math.floor((solar.h + 1) / 2) % 12) }
}

/**
 * 사주 원국. 날짜는 양력이고, 시각은 그 시간대의 벽시계다.
 * 시각을 모르면 정오로 보고 시 기둥은 비운다.
 */
export function birthChart(
  date: { y: number; m: number; d: number },
  time: { h: number; min: number } | null,
  timeZone: string
): Chart {
  const wall = { ...date, h: time?.h ?? 12, min: time?.min ?? 0 }
  const utc = wallToUtc(timeZone, wall)
  const solar = wallAt('UTC', utc + solarOffset(timeZone, utc) * 60000)
  const { day, hour } = dayHour(solar)
  const termEdge =
    !time &&
    termBetween(
      wallToUtc(timeZone, { ...date, h: 0, min: 0 }),
      wallToUtc(timeZone, { ...date, h: 23, min: 59 }) + 60000
    )
  return { ...yearMonth(utc), day, hour: time ? hour : null, termEdge }
}

export type Today = {
  /** 방문자 시간대의 오늘 날짜 */
  date: { y: number; m: number; d: number }
  year: Pillar
  month: Pillar
  day: Pillar
  /** 자시부터 해시까지 열두 시진의 기둥 */
  hours: Pillar[]
  /** 시진 경계가 벽시계로 몇 분 밀리는가(서울은 30분: 자시 23:30–01:30) */
  shift: number
}

/** 오늘의 세운·월운·일진. 일진은 방문자의 달력 날짜로 본다. */
export function todayOf(now: number, timeZone: string): Today {
  const w = wallAt(timeZone, now)
  const day = dayPillarOfJdn(jdnOf(w.y, w.m, w.d))
  return {
    date: { y: w.y, m: w.m, d: w.d },
    ...yearMonth(now),
    day,
    hours: Array.from({ length: 12 }, (_, b) => hourPillar(day.stem, b)),
    shift: zoneOffset(timeZone, now) - solarOffset(timeZone, now),
  }
}
