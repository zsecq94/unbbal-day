/**
 * 그냥 뽑기: 1–45에서 여섯 개를 고르게 뽑는다(crypto 난수, 거절 샘플링).
 * 고정수는 반드시 넣고 제외수는 빼며, 그 밖의 필터(자주 나온 번호 등)는 두지 않는다.
 */

import { PICK, TOTAL } from '@/lib/lotto/orbit'

export const MAX_GAMES = 5
export const MAX_FIXED = 5
/** 고정수도 여섯 안에 들므로, 제외하고 남은 칸이 여섯 개는 돼야 한다 */
export const MAX_EXCLUDED = TOTAL - PICK
export const GAME_LABELS = ['A', 'B', 'C', 'D', 'E']

/** 0 ≤ x < n 균등 정수 */
function uniform(n: number) {
  const limit = Math.floor(0x100000000 / n) * n
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit)
  return buf[0] % n
}

export type Game = {
  /** 뽑힌 순서(고정수도 무작위 자리에 섞는다) */
  order: number[]
  /** 오름차순 */
  numbers: number[]
  fixed: number[]
}

export function drawRandom({
  fixed = [],
  excluded = [],
}: { fixed?: number[]; excluded?: number[] } = {}): Game {
  const pool: number[] = []
  for (let n = 1; n <= TOTAL; n++)
    if (!fixed.includes(n) && !excluded.includes(n)) pool.push(n)
  const order: number[] = []
  for (let i = 0; i < PICK - fixed.length; i++)
    order.push(pool.splice(uniform(pool.length), 1)[0])
  for (const f of fixed) order.splice(uniform(order.length + 1), 0, f)
  return {
    order,
    numbers: [...order].sort((a, b) => a - b),
    fixed: [...fixed],
  }
}
