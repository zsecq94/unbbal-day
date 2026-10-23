/**
 * 오늘의 운세 → 로또 번호 뽑기로 넘기는 원국 입력.
 * 브라우저 메모리에만 둔다(URL·저장소에 남기지 않고, 새로고침하면 사라진다).
 * 이름은 넘기지 않는다. 번호 계산에 쓰지 않는다.
 */

import type { Profile } from '@/lib/fortune'

export type Handoff = {
  /** 넘길 때마다 늘어난다. 로또 화면은 이미 본 번호면 다시 걷지 않는다. */
  id: number
  profile: Profile
  /** 걷기를 한 번 보여 줬는가(언어를 바꿔 다시 열면 바로 결과를 보여 준다) */
  walked: boolean
}

let current: Handoff | null = null

export function handOff(p: Profile) {
  current = {
    id: (current?.id ?? 0) + 1,
    profile: { ...p, name: '' },
    walked: false,
  }
}

export const currentHandoff = () => current

export function markWalked(id: number) {
  if (current?.id === id) current.walked = true
}
