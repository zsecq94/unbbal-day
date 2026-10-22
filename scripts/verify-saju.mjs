/**
 * 사주 엔진 교차 검증. lib/saju의 결과를 lunar-javascript(寿星 천문 알고리즘)와
 * 한국천문연구원 공개값에 맞춰 본다.
 *
 *   node scripts/verify-saju.mjs
 */
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { LunarUtil, Solar } from 'lunar-javascript'

/* `@/` 별칭과 확장자 없는 경로를 TypeScript 파일로 푼다 */
const root = fileURLToPath(new URL('..', import.meta.url))
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) {
      const file = root + specifier.slice(2)
      for (const ext of ['.ts', '.tsx'])
        if (existsSync(file + ext))
          return { url: pathToFileURL(file + ext).href, shortCircuit: true }
    }
    return next(specifier, context)
  },
})

const { birthChart, todayOf } = await import('@/lib/saju/chart')
const { tenGodOf, TEN_GODS } = await import('@/lib/saju/ganji')
const { lunarToSolar } = await import('@/lib/saju/lunar')

const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const gz = (p) => STEMS[p.stem] + BRANCHES[p.branch]
const SHISHEN = [
  '比肩',
  '劫财',
  '食神',
  '伤官',
  '偏财',
  '正财',
  '七杀',
  '正官',
  '偏印',
  '正印',
]

let failures = 0
const fail = (msg) => {
  failures++
  if (failures <= 20) console.log('  FAIL', msg)
}
const section = (name) => console.log(`\n${name}`)

/* 결정적 난수 */
let seed = 20261022
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}
const pad = (n) => String(n).padStart(2, '0')

/** 어떤 UTC 시각을 그 오프셋의 벽시계 Solar로 */
const solarAt = (utc, offsetMin) => {
  const d = new Date(utc + offsetMin * 60000)
  return Solar.fromYmdHms(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    0
  )
}

section('1. 사주 네 기둥: 서울 출생 무작위 2만 건(1900–2050)')
{
  let n = 0
  for (let i = 0; i < 20000; i++) {
    const utc =
      Date.UTC(1900, 1, 1) +
      rand() * (Date.UTC(2050, 0, 1) - Date.UTC(1900, 1, 1))
    const off = (() => {
      const f = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul',
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      })
      const p = Object.fromEntries(
        f.formatToParts(utc).map((x) => [x.type, +x.value])
      )
      return {
        y: p.year,
        m: p.month,
        d: p.day,
        h: p.hour,
        min: p.minute,
        sec: p.second,
      }
    })()
    const chart = birthChart(
      { y: off.y, m: off.m, d: off.d },
      { h: off.h, min: off.min },
      'Asia/Seoul'
    )
    /* 벽시계 분이 시작된 순간 */
    const t = Math.floor(utc / 1000) * 1000 - off.sec * 1000
    /* 해·달은 절입 시각 비교라 베이징 시각(UTC+8)으로, 날·시는 태양시(UTC+8:30)로 넣는다 */
    const ym = solarAt(t, 480).getLunar().getEightChar()
    const dh = solarAt(t, 510).getLunar().getEightChar()
    dh.setSect(1)
    const want = [ym.getYear(), ym.getMonth(), dh.getDay(), dh.getTime()]
    const got = [chart.year, chart.month, chart.day, chart.hour].map(gz)
    if (want.join() !== got.join())
      fail(
        `${off.y}-${pad(off.m)}-${pad(off.d)} ${pad(off.h)}:${pad(off.min)} KST want ${want} got ${got}`
      )
    n++
  }
  console.log(`  ${n}건 비교`)
}

section(
  '1-1. 다른 시간대 출생: 뉴욕 무작위 5천 건(태양시는 서머타임을 뺀 표준시)'
)
{
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
  let n = 0
  for (let i = 0; i < 5000; i++) {
    const utc =
      Math.floor(
        (Date.UTC(1950, 0, 1) +
          rand() * (Date.UTC(2050, 0, 1) - Date.UTC(1950, 0, 1))) /
          60000
      ) * 60000
    const p = Object.fromEntries(
      f.formatToParts(utc).map((x) => [x.type, +x.value])
    )
    const chart = birthChart(
      { y: p.year, m: p.month, d: p.day },
      { h: p.hour, min: p.minute },
      'America/New_York'
    )
    const ym = solarAt(utc, 480).getLunar().getEightChar()
    const dh = solarAt(utc, -300).getLunar().getEightChar()
    dh.setSect(1)
    const want = [ym.getYear(), ym.getMonth(), dh.getDay(), dh.getTime()]
    const got = [chart.year, chart.month, chart.day, chart.hour].map(gz)
    if (want.join() !== got.join())
      fail(
        `NY ${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} want ${want} got ${got}`
      )
    n++
  }
  console.log(`  ${n}건 비교`)
}

section('2. 알려진 절입 시각(KASI, KST)')
{
  const cases = [
    ['2024-02-04', 17, 26, '癸卯', '乙丑'],
    ['2024-02-04', 17, 28, '甲辰', '丙寅'],
    ['2025-02-03', 23, 9, '甲辰', '丁丑'],
    ['2025-02-03', 23, 11, '乙巳', '戊寅'],
  ]
  for (const [date, h, min, year, month] of cases) {
    const [y, m, d] = date.split('-').map(Number)
    const c = birthChart({ y, m, d }, { h, min }, 'Asia/Seoul')
    const got = [gz(c.year), gz(c.month)]
    if (got.join() !== [year, month].join())
      fail(`${date} ${h}:${min} want ${year}${month} got ${got}`)
  }
  console.log(`  ${cases.length}건 비교`)
}

section('3. 서머타임·표준시 변경기 출생')
{
  /* 1987-07-01 10:30 KDT(UTC+10) = 00:30 UTC = 09:00 태양시 → 사시 */
  const a = birthChart(
    { y: 1987, m: 7, d: 1 },
    { h: 10, min: 30 },
    'Asia/Seoul'
  )
  if (BRANCHES[a.hour.branch] !== '巳') fail(`1987 DST hour ${gz(a.hour)}`)
  /* 1960-03-01 23:10 KST(UTC+8:30) = 태양시 23:10 → 다음 날 자시 */
  const b = birthChart(
    { y: 1960, m: 3, d: 1 },
    { h: 23, min: 10 },
    'Asia/Seoul'
  )
  const want = solarAt(Date.UTC(1960, 2, 1, 14, 40), 510)
    .getLunar()
    .getEightChar()
  want.setSect(1)
  if (gz(b.day) + gz(b.hour) !== want.getDay() + want.getTime())
    fail(
      `1960 +8:30 want ${want.getDay()}${want.getTime()} got ${gz(b.day)}${gz(b.hour)}`
    )
  /* 2000-01-01 23:20 KST = 태양시 22:50 → 아직 해시, 같은 날 */
  const c = birthChart(
    { y: 2000, m: 1, d: 1 },
    { h: 23, min: 20 },
    'Asia/Seoul'
  )
  if (gz(c.day) !== '戊午' || BRANCHES[c.hour.branch] !== '亥')
    fail(`2000-01-01 23:20 got ${gz(c.day)}${gz(c.hour)}`)
  console.log('  3건 비교')
}

section('4. 시각 없는 절입일 표시')
{
  const edge = birthChart({ y: 2024, m: 2, d: 4 }, null, 'Asia/Seoul')
  const plain = birthChart({ y: 2024, m: 2, d: 5 }, null, 'Asia/Seoul')
  if (!edge.termEdge || plain.termEdge) fail('termEdge')
  console.log('  2건 비교')
}

section('5. 음력 → 양력(KASI)')
{
  const cases = [
    [2024, 1, 1, false, '2024-02-10'],
    [2023, 8, 15, false, '2023-09-29'],
    [2023, 2, 1, true, '2023-03-22'],
    [2020, 4, 1, true, '2020-05-23'],
    [1990, 1, 1, false, '1990-01-27'],
  ]
  for (const [y, m, d, leap, want] of cases) {
    const s = lunarToSolar(y, m, d, leap)
    const got = s && `${s.y}-${pad(s.m)}-${pad(s.d)}`
    if (got !== want)
      fail(`lunar ${y}-${m}-${d}${leap ? ' leap' : ''} want ${want} got ${got}`)
  }
  if (lunarToSolar(2023, 3, 1, true)) fail('윤3월은 2023년에 없다')
  if (lunarToSolar(2024, 1, 30, false)) fail('2024년 음력 1월은 29일까지')
  console.log(`  ${cases.length + 2}건 비교`)
}

section('6. 오늘의 일진·십성: 2000–2040 날마다')
{
  let n = 0
  for (
    let t = Date.UTC(2000, 0, 1, 3);
    t < Date.UTC(2040, 0, 1);
    t += 86400000
  ) {
    const today = todayOf(t, 'Asia/Seoul')
    const lunar = solarAt(t, 540).getLunar()
    if (gz(today.day) !== lunar.getDayInGanZhi())
      fail(`day ${new Date(t).toISOString()}`)
    n++
  }
  for (let dm = 0; dm < 10; dm++)
    for (let s = 0; s < 10; s++) {
      const want = LunarUtil.SHI_SHEN[STEMS[dm] + STEMS[s]]
      const got = SHISHEN[TEN_GODS.indexOf(tenGodOf(dm, s))]
      if (want !== got)
        fail(`ten god ${STEMS[dm]}→${STEMS[s]} want ${want} got ${got}`)
    }
  console.log(`  ${n}일, 십성 100쌍 비교`)
}

console.log(failures ? `\n실패 ${failures}건` : '\n모두 통과')
process.exit(failures ? 1 : 0)
