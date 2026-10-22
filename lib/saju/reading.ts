import type { Chart, Today } from '@/lib/saju/chart'
import {
  TEN_GODS,
  branchElement,
  branchStem,
  isClash,
  isHalfTrine,
  isHarm,
  isPunish,
  isSixCombine,
  isStemClash,
  isStemCombine,
  isWonjin,
  peachBlossom,
  stemElement,
  tenGodGroup,
  tenGodOf,
  type Pillar,
  type TenGod,
} from '@/lib/saju/ganji'

export const DOMAIN_KEYS = ['money', 'love', 'health', 'work', 'rel'] as const
export type DomainKey = (typeof DOMAIN_KEYS)[number]

/** 점수에 영향을 준 일. 각주에서 근거로 보여 준다. */
export type Reason =
  | 'combineDay'
  | 'combineOther'
  | 'trine'
  | 'peach'
  | 'clashDay'
  | 'clashMonth'
  | 'clashYear'
  | 'clashHour'
  | 'wonjin'
  | 'punish'
  | 'stemCombine'
  | 'stemClash'
  | 'favorable'
  | 'unfavorable'
type Effect = Partial<Record<DomainKey, number>>

/* ─── 원국 ─────────────────────────────────────────────────── */

/** 용신 하나를 정했을 때 오행별 유불리: 용신 1, 용신을 낳는 희신 0.6, 용신을 치는 기신 -1, 기신을 낳는 구신 -0.6 */
function favorFor(yong: number) {
  const favor = [0, 0, 0, 0, 0]
  favor[yong] = 1
  favor[(yong + 4) % 5] = 0.6
  favor[(yong + 3) % 5] = -1
  favor[(yong + 2) % 5] = -0.6
  return favor
}

const share = (a: number, b: number) => (a + b > 0 ? a / (a + b) : 0.5)

/**
 * 오행 분포와 일간의 강약으로 오행별 유불리를 정한다(억부법).
 * 천간과 지지 본기를 1로 세고, 계절을 정하는 월지만 2로 센다.
 * 신강하면 재성(인성이 많을 때)이나 관성(비겁이 많을 때)이, 신약하면 비겁(재성이 많을 때)이나
 * 인성이 용신이다. 경계에 걸친 사주가 글자 하나로 정반대가 되지 않도록 문턱 대신 비율로 섞는다.
 */
function favorOf(chart: Chart) {
  const count = [0, 0, 0, 0, 0]
  const pillars = [chart.year, chart.month, chart.day, chart.hour].filter(
    (p): p is Pillar => p !== null
  )
  for (const p of pillars) {
    if (p !== chart.day) count[stemElement(p.stem)] += 1
    count[branchElement(p.branch)] += p === chart.month ? 2 : 1
  }
  /* 무리별 세기: 0 비겁, 1 식상, 2 재성, 3 관성, 4 인성 */
  const me = stemElement(chart.day.stem)
  const group = (g: number) => count[(me + g) % 5]
  const support = group(0) + group(4)
  const drain = group(1) + group(2) + group(3)

  /* 신강 정도: 돕는 기운의 비율이 0.5에서 멀수록 한쪽으로 기운다 */
  const strong = Math.max(
    0,
    Math.min(1, 0.5 + (share(support, drain) - 0.5) * 4)
  )
  const a = share(group(4), group(0))
  const b = share(group(2), Math.max(group(1), group(3)))
  const mix = [
    [strong * a, 2],
    [strong * (1 - a), 3],
    [(1 - strong) * b, 0],
    [(1 - strong) * (1 - b), 4],
  ] as const
  const favor = [0, 0, 0, 0, 0]
  for (const [w, use] of mix)
    favorFor((me + use) % 5).forEach((v, e) => (favor[e] += w * v))
  return { count, favor }
}

/* ─── 오늘 ─────────────────────────────────────────────────── */

/** 십성이 분야마다 갖는 결. 좋고 나쁨과 별개로 그 기운이 무엇을 건드리는가. */
const NATURE: Record<DomainKey, Record<TenGod, number>> = {
  money: {
    bigyeon: -0.4,
    geopjae: -1,
    siksin: 0.5,
    sanggwan: 0.2,
    pyeonjae: 1,
    jeongjae: 0.8,
    pyeongwan: -0.2,
    jeonggwan: 0,
    pyeonin: -0.3,
    jeongin: 0,
  },
  love: {
    bigyeon: -0.2,
    geopjae: -0.6,
    siksin: 0.4,
    sanggwan: 0,
    pyeonjae: 0,
    jeongjae: 0,
    pyeongwan: 0,
    jeonggwan: 0,
    pyeonin: -0.4,
    jeongin: 0.2,
  },
  health: {
    bigyeon: 0.3,
    geopjae: -0.2,
    siksin: 0.6,
    sanggwan: -0.3,
    pyeonjae: -0.1,
    jeongjae: 0,
    pyeongwan: -0.8,
    jeonggwan: 0.1,
    pyeonin: -0.2,
    jeongin: 0.6,
  },
  work: {
    bigyeon: 0,
    geopjae: -0.3,
    siksin: 0.4,
    sanggwan: -0.2,
    pyeonjae: 0.2,
    jeongjae: 0.3,
    pyeongwan: 0.6,
    jeonggwan: 1,
    pyeonin: 0.2,
    jeongin: 0.5,
  },
  rel: {
    bigyeon: 0.4,
    geopjae: -0.2,
    siksin: 0.5,
    sanggwan: -0.6,
    pyeonjae: 0.4,
    jeongjae: 0.2,
    pyeongwan: -0.4,
    jeonggwan: 0.3,
    pyeonin: -0.3,
    jeongin: 0.5,
  },
}

/** 애정은 배우자 별을 본다. 여성은 관성, 남성은 재성. 모르면 반씩. */
function loveNature(g: TenGod, gender: '' | 'f' | 'm' | 'x') {
  const spouse = { f: 3, m: 2 } as Record<string, number>
  const star = (group: number) =>
    tenGodGroup(g) === group ? (g.startsWith('jeong') ? 1 : 0.6) : 0
  const base = NATURE.love[g]
  if (gender in spouse) return base + star(spouse[gender])
  return base + (star(2) + star(3)) / 2
}

/** 오늘의 기운: 일진이 가장 크고, 월운·세운이 뒤를 받친다. */
const SOURCES: { pick: (t: Today) => Pillar; w: [number, number] }[] = [
  { pick: (t) => t.day, w: [0.32, 0.28] },
  { pick: (t) => t.month, w: [0.12, 0.12] },
  { pick: (t) => t.year, w: [0.08, 0.08] },
]

/** 오늘 들어오는 지지·천간이 원국과 맺는 관계 */
function relations(chart: Chart, today: Today) {
  const b = today.day.branch
  const out: { reason: Reason; effect: Effect }[] = []
  const add = (reason: Reason, effect: Effect) => out.push({ reason, effect })
  const natal = [
    ['year', chart.year],
    ['month', chart.month],
    ['day', chart.day],
    ['hour', chart.hour],
  ] as const

  for (const [at, p] of natal) {
    if (!p) continue
    if (isSixCombine(b, p.branch))
      add(
        at === 'day' ? 'combineDay' : 'combineOther',
        at === 'day' ? { love: 7, rel: 3, health: 2 } : { rel: 3, work: 2 }
      )
    if (isClash(b, p.branch))
      add(
        (
          {
            day: 'clashDay',
            month: 'clashMonth',
            year: 'clashYear',
            hour: 'clashHour',
          } as const
        )[at],
        {
          day: { love: -7, health: -5 },
          month: { work: -5, health: -3 },
          year: { rel: -4 },
          hour: { health: -3, love: -2 },
        }[at]
      )
  }
  const branches = natal.flatMap(([, p]) => (p ? [p.branch] : []))
  if (branches.some((x) => isHalfTrine(b, x)))
    add('trine', { work: 2, rel: 2, money: 1, health: 1 })
  if ([chart.year.branch, chart.day.branch].some((x) => peachBlossom(x) === b))
    add('peach', { love: 6, rel: 1 })
  /* 원진·해는 사람 사이의 일이라 년지(집안)와 일지(나와 배우자)만 본다 */
  if (
    [chart.year.branch, chart.day.branch].some(
      (x) => isWonjin(b, x) || isHarm(b, x)
    )
  )
    add('wonjin', { love: -3, rel: -3 })
  if (branches.some((x) => isPunish(b, x)))
    add('punish', { health: -3, rel: -2 })
  if (isStemCombine(today.day.stem, chart.day.stem))
    add('stemCombine', { love: 5, rel: 2 })
  if (isStemClash(today.day.stem, chart.day.stem))
    add('stemClash', { health: -3, work: -3 })
  return out
}

const clamp = (v: number, a: number, b: number) =>
  Math.round(Math.max(a, Math.min(b, v)))

export type Reading = {
  /** 오늘 일진 천간이 일간에게 무엇인가. 그날의 주제다. */
  tenGod: TenGod
  domains: { key: DomainKey; score: number; reason: Reason | TenGod }[]
  total: number
  /** 자시부터 해시까지 열두 시진 점수 */
  hours: number[]
  /** 깨어 있는 시간(묘시–술시) 가운데 가장 좋은 시진 */
  best: number
  /** 원국의 오행 개수(월지는 2로 셈) */
  elements: number[]
  /** 가장 필요한 오행(용신) */
  yong: number
}

/**
 * 원국과 오늘의 기운을 맞춰 분야별 점수를 낸다.
 * 점수 = 기준 58 + 오늘 오행이 용신에 맞는 정도 × 30 + 십성의 결 × 14 + 합충 등 관계.
 */
export function readDay(
  chart: Chart,
  today: Today,
  gender: '' | 'f' | 'm' | 'x'
): Reading {
  const dm = chart.day.stem
  const { count, favor } = favorOf(chart)
  const raw = (key: DomainKey, g: TenGod) =>
    key === 'love' ? loveNature(g, gender) : NATURE[key][g]
  /* 분야끼리 공평하도록 열 가지 십성의 평균을 0에 맞춘다 */
  const mean = Object.fromEntries(
    DOMAIN_KEYS.map((key) => [
      key,
      TEN_GODS.reduce((a, g) => a + raw(key, g), 0) / TEN_GODS.length,
    ])
  ) as Record<DomainKey, number>
  const nature = (key: DomainKey, g: TenGod) => raw(key, g) - mean[key]

  /* 오늘 기운 하나하나: 오행(용신 적합도)과 십성 */
  const flows = SOURCES.flatMap(({ pick, w }) => {
    const p = pick(today)
    return [
      { fit: favor[stemElement(p.stem)], god: tenGodOf(dm, p.stem), w: w[0] },
      {
        fit: favor[branchElement(p.branch)],
        god: tenGodOf(dm, branchStem(p.branch)),
        w: w[1],
      },
    ]
  })
  const fit = flows.reduce((a, f) => a + f.w * f.fit, 0)
  const rels = relations(chart, today)

  const domains = DOMAIN_KEYS.map((key) => {
    const natureSum = flows.reduce((a, f) => a + f.w * nature(key, f.god), 0)
    const relSum = rels.reduce((a, r) => a + (r.effect[key] ?? 0), 0)
    /* 근거: 이 분야 점수를 가장 크게 움직인 관계나 십성. 용신 적합도는 모든 분야에
       같이 걸리므로 낮은 무게로 겨룬다. */
    const causes = [
      {
        why: fit >= 0 ? ('favorable' as const) : ('unfavorable' as const),
        size: fit * 6,
      },
      ...rels.map((r) => ({ why: r.reason, size: r.effect[key] ?? 0 })),
      ...flows.map((f) => ({
        why: f.god,
        size: f.w * nature(key, f.god) * 14,
      })),
    ].sort((a, b) => Math.abs(b.size) - Math.abs(a.size))
    return {
      key,
      score: clamp(58 + fit * 30 + natureSum * 14 + relSum, 24, 97),
      reason: causes[0].why,
    }
  })
  const total = Math.round(
    domains.reduce((a, d) => a + d.score, 0) / domains.length
  )

  /* 시진: 그 시의 기둥이 용신에 맞는가와 원국과의 합충을 하루 총운에 얹는다 */
  const hours = today.hours.map((p) => {
    const hourFit =
      0.55 * favor[stemElement(p.stem)] + 0.45 * favor[branchElement(p.branch)]
    /* 일지와의 관계가 가장 크고, 태어난 시지와의 관계가 뒤를 잇는다 */
    const relTo = (natal: number, [combine, clash, trine]: number[]) =>
      isSixCombine(p.branch, natal)
        ? combine
        : isClash(p.branch, natal)
          ? clash
          : isHalfTrine(p.branch, natal)
            ? trine
            : 0
    const rel =
      relTo(chart.day.branch, [6, -8, 3]) +
      (chart.hour ? relTo(chart.hour.branch, [3, -4, 2]) : 0)
    return clamp(total + hourFit * 20 + rel, 28, 97)
  })
  const awake = hours.slice(3, 11)
  const ties = awake.flatMap((v, i) =>
    v === Math.max(...awake) ? [i + 3] : []
  )
  /* 같은 점수가 여럿이면 날마다 다른 쪽을 고른다 */
  const best = ties[(today.day.stem + chart.day.branch) % ties.length]

  return {
    tenGod: tenGodOf(dm, today.day.stem),
    domains,
    total,
    hours,
    best,
    elements: count,
    yong: favor.indexOf(Math.max(...favor)),
  }
}
