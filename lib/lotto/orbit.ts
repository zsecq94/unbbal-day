/**
 * 상생 궤도: 운빨데이가 만든, 사주로 로또 번호 여섯 개를 고르는 방식이다.
 * 재료(간지 순번, 하도 수, 상생·상극, 기신)는 명리에서 가져왔다.
 *
 * 1. 1–45를 한 바퀴 길로 잇는다(45 다음은 1). 칸의 오행은 끝자리 하도 수로 정한다.
 * 2. 출발 칸은 오늘 일진의 60갑자 순번(1부터)을 45로 나눈 나머지 칸이다.
 * 3. 시주를 알면 시간·시지만큼 먼저 걸어 출발 칸을 옮긴다(번호는 놓지 않는다).
 * 4. 원국의 년·월·일 여섯 글자로 한 번씩 걷고, 걸을 때마다 내려앉은 칸이 번호가 된다.
 *    걸음 수 = 글자 번호(천간 1–10, 지지 1–12) + 오늘 일진의 같은 쪽 글자 번호.
 * 5. 지금 칸과 글자의 오행이 상극이면 작은 번호 쪽, 아니면 큰 번호 쪽으로 걷는다.
 * 6. 기신 칸이나 이미 뽑힌 칸에 내리면 같은 방향으로 한 칸씩 더 간다.
 *
 * 같은 원국이면 같은 날에는 같은 번호가 나온다. 어느 번호든 당첨 확률은 같다.
 */

import type { Chart } from '@/lib/saju/chart'
import { branchElement, stemElement, type Pillar } from '@/lib/saju/ganji'

export const TOTAL = 45
export const PICK = 6

/** 하도(河圖) 수: 끝자리 → 오행(목화토금수 = 0–4). 1·6 수, 2·7 화, 3·8 목, 4·9 금, 5·0 토 */
const HADO = [2, 4, 1, 0, 3, 2, 4, 1, 0, 3]
export const cellElement = (n: number) => HADO[n % 10]
/** 오행별 하도 끝자리(목화토금수 순) */
export const HADO_DIGITS = ['3·8', '2·7', '5·0', '4·9', '1·6']

/** 1–45를 한 바퀴로 잇는다 */
export const wrap = (c: number) => ((((c - 1) % TOTAL) + TOTAL) % TOTAL) + 1

export type Relation = 'same' | 'gen' | 'clash'
/** 지금 칸의 오행 a와 글자의 오행 b의 관계 */
export const relation = (a: number, b: number): Relation =>
  (['same', 'gen', 'clash', 'clash', 'gen'] as const)[(b - a + 5) % 5]

/** 60갑자 순번(0 = 갑자) */
export const sexagenary = (p: Pillar) => {
  for (let n = 0; n < 60; n++)
    if (n % 10 === p.stem && n % 12 === p.branch) return n
  return 0
}

/** 오늘 일진의 출발 칸 */
export const startCell = (day: Pillar) => (sexagenary(day) % TOTAL) + 1

export type PillarKey = 'hour' | 'year' | 'month' | 'day'
export type Side = 'stem' | 'branch'

export type Move = {
  pillar: PillarKey
  side: Side
  /** 천간 0–9 또는 지지 0–11 */
  index: number
  /** 글자의 오행 */
  el: number
  /** 글자 번호(천간 1–10, 지지 1–12) */
  value: number
  /** 더한 오늘 일진 글자 번호(시주 걸음은 0) */
  plus: number
  steps: number
  from: number
  to: number
  /** 출발 칸의 오행 */
  fromEl: number
  rel: Relation
  /** 1이면 큰 번호 쪽, -1이면 작은 번호 쪽 */
  dir: 1 | -1
  /** 지나간 칸(내려앉은 칸과 비켜 간 칸 포함) */
  path: number[]
  skipped: { cell: number; why: 'gi' | 'taken' }[]
  /** 번호를 놓은 걸음인가(시주 걸음은 출발 칸만 옮긴다) */
  land: boolean
}

export type Orbit = {
  start: number
  /** 기신 오행 */
  gi: number
  moves: Move[]
  /** 내려앉은 순서 */
  picks: number[]
  /** 오름차순 */
  numbers: number[]
}

/** 용신을 치는 오행(기신) */
export const giOf = (yong: number) => (yong + 3) % 5

export function orbit(chart: Chart, today: Pillar, yong: number): Orbit {
  const gi = giOf(yong)
  const start = startCell(today)
  let pos = start
  const taken = new Set<number>()
  const moves: Move[] = []

  const walk = (pillar: PillarKey, side: Side, plus: number, land: boolean) => {
    const p = chart[pillar]!
    const index = side === 'stem' ? p.stem : p.branch
    const el = side === 'stem' ? stemElement(p.stem) : branchElement(p.branch)
    const value = index + 1
    const from = pos
    const fromEl = cellElement(from)
    const rel = relation(fromEl, el)
    const dir = rel === 'clash' ? -1 : 1
    const steps = value + plus
    const path = Array.from({ length: steps }, (_, i) =>
      wrap(from + dir * (i + 1))
    )
    pos = wrap(from + dir * steps)
    const skipped: Move['skipped'] = []
    if (land) {
      while (taken.has(pos) || cellElement(pos) === gi) {
        skipped.push({ cell: pos, why: taken.has(pos) ? 'taken' : 'gi' })
        pos = wrap(pos + dir)
        path.push(pos)
      }
      taken.add(pos)
    }
    moves.push({
      pillar,
      side,
      index,
      el,
      value,
      plus,
      steps,
      from,
      to: pos,
      fromEl,
      rel,
      dir,
      path,
      skipped,
      land,
    })
  }

  if (chart.hour) {
    walk('hour', 'stem', 0, false)
    walk('hour', 'branch', 0, false)
  }
  for (const pillar of ['year', 'month', 'day'] as const) {
    walk(pillar, 'stem', today.stem + 1, true)
    walk(pillar, 'branch', today.branch + 1, true)
  }
  const picks = moves.filter((m) => m.land).map((m) => m.to)
  return { start, gi, moves, picks, numbers: [...picks].sort((a, b) => a - b) }
}
