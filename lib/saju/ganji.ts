/**
 * 간지 기본 규칙. 천간은 0–9(갑을병정무기경신임계), 지지는 0–11(자축인묘진사오미신유술해),
 * 오행은 0–4(목화토금수) 번호로 다룬다.
 */

export type Pillar = { stem: number; branch: number }

/** 60갑자 번호(0 = 갑자)의 기둥 */
export const pillarAt = (n: number): Pillar => {
  const i = ((n % 60) + 60) % 60
  return { stem: i % 10, branch: i % 12 }
}

export const stemElement = (stem: number) => Math.floor(stem / 2)

/** 지지의 본기(지장간 중 주된 천간). 십성과 오행은 본기로 본다. */
const BRANCH_MAIN_STEM = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8]
export const branchStem = (branch: number) => BRANCH_MAIN_STEM[branch]
export const branchElement = (branch: number) =>
  stemElement(BRANCH_MAIN_STEM[branch])

export const TEN_GODS = [
  'bigyeon',
  'geopjae',
  'siksin',
  'sanggwan',
  'pyeonjae',
  'jeongjae',
  'pyeongwan',
  'jeonggwan',
  'pyeonin',
  'jeongin',
] as const
export type TenGod = (typeof TEN_GODS)[number]

/**
 * 일간(dm)에서 본 다른 천간의 십성. 오행 차이가 곧 무리(비겁·식상·재성·관성·인성)이고,
 * 음양이 같으면 앞의 것(비견·식신·편재·편관·편인)이다.
 */
export function tenGodOf(dm: number, stem: number): TenGod {
  const group = (stemElement(stem) - stemElement(dm) + 5) % 5
  return TEN_GODS[group * 2 + (dm % 2 === stem % 2 ? 0 : 1)]
}

/** 십성의 무리: 0 비겁, 1 식상, 2 재성, 3 관성, 4 인성 */
export const tenGodGroup = (g: TenGod) => Math.floor(TEN_GODS.indexOf(g) / 2)

/* 지지 관계 */
export const isSixCombine = (a: number, b: number) => (a + b) % 12 === 1
export const isClash = (a: number, b: number) => Math.abs(a - b) === 6
/** 삼합의 두 글자(반합) */
export const isHalfTrine = (a: number, b: number) => a !== b && a % 4 === b % 4
const WONJIN = ['0-7', '1-6', '2-9', '3-8', '4-11', '5-10']
export const isWonjin = (a: number, b: number) =>
  WONJIN.includes(`${Math.min(a, b)}-${Math.max(a, b)}`)
export const isHarm = (a: number, b: number) => (a + b) % 12 === 7
const PUNISH = [
  [2, 5],
  [5, 8],
  [2, 8],
  [1, 10],
  [10, 7],
  [1, 7],
  [0, 3],
]
const SELF_PUNISH = [4, 6, 9, 11]
export const isPunish = (a: number, b: number) =>
  (a === b && SELF_PUNISH.includes(a)) ||
  PUNISH.some(([x, y]) => (a === x && b === y) || (a === y && b === x))
/** 도화: 삼합의 왕지 다음 자리(신자진→유, 인오술→묘, 사유축→오, 해묘미→자) */
export const peachBlossom = (branch: number) => [9, 6, 3, 0][branch % 4]

/* 천간 관계 */
export const isStemCombine = (a: number, b: number) => Math.abs(a - b) === 5
export const isStemClash = (a: number, b: number) => Math.abs(a - b) === 6

/** 년 천간으로 인월(寅月)의 천간을 정한다(오호둔). 다른 달은 이어서 센다. */
export function monthPillar(yearStem: number, branch: number): Pillar {
  const tigerStem = ((yearStem % 5) * 2 + 2) % 10
  return { stem: (tigerStem + ((branch - 2 + 12) % 12)) % 10, branch }
}

/** 일 천간으로 자시의 천간을 정한다(오서둔). */
export function hourPillar(dayStem: number, branch: number): Pillar {
  return { stem: ((dayStem % 5) * 2 + branch) % 10, branch }
}

/** 율리우스 일수로 그날의 일진 */
export const dayPillarOfJdn = (jdn: number) => pillarAt(jdn + 49)

/** 그레고리력 날짜의 율리우스 일수 */
export const jdnOf = (y: number, m: number, d: number) =>
  Math.round(Date.UTC(y, m - 1, d) / 86400000) + 2440588
