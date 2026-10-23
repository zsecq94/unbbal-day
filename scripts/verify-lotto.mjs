/**
 * 로또 번호 뽑기 검증. lib/lotto의 상생 궤도와 그냥 뽑기를 규칙과 분포로 맞춰 본다.
 * - 하도 묶음이 1–45를 오행마다 9개씩 겹침 없이 나누는가
 * - 같은 입력이면 같은 번호인가, 여섯 개가 서로 다르고 정렬됐는가, 기신 칸이 빠지는가
 * - 걸음 기록이 규칙(걸음 수·방향·비켜 가기)대로인가
 * - 무작위 원국 수만 개에서 번호가 고르게 나오는가, 다음 날과 같은 번호가 드문가
 * - 그냥 뽑기가 고르고(카이제곱), 고정·제외를 지키는가
 *
 *   node scripts/verify-lotto.mjs
 */
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

const { orbit, cellElement, wrap, relation, giOf, TOTAL, PICK } =
  await import('@/lib/lotto/orbit')
const { drawRandom, MAX_EXCLUDED } = await import('@/lib/lotto/random')
const { luckyDraw, nextDraw } = await import('@/lib/lotto/index')
const { pillarAt, stemElement, branchElement } =
  await import('@/lib/saju/ganji')

let pass = 0
const fails = []
const check = (label, ok, detail = '') => {
  if (ok) pass++
  else fails.push(`${label}${detail ? `\n    ${detail}` : ''}`)
}

/* 결정적 난수(검증을 다시 돌려도 같은 표본) */
function mulberry32(a) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(45)
const pick = (n) => Math.floor(rnd() * n)
const randomChart = (withHour) => ({
  year: pillarAt(pick(60)),
  month: pillarAt(pick(60)),
  day: pillarAt(pick(60)),
  hour: withHour ? pillarAt(pick(60)) : null,
  termEdge: false,
})

/* ── 하도 묶음 ──────────────────────────────────────────────── */
{
  const count = [0, 0, 0, 0, 0]
  for (let n = 1; n <= TOTAL; n++) count[cellElement(n)]++
  check(
    '하도 묶음: 오행마다 9칸',
    count.every((c) => c === 9),
    `${count}`
  )
  check(
    '하도: 1·6 수, 2·7 화, 3·8 목, 4·9 금, 5·0 토',
    [1, 6, 2, 7, 3, 8, 4, 9, 5, 10].map(cellElement).join() ===
      '4,4,1,1,0,0,3,3,2,2'
  )
  check('한 바퀴: 45 다음은 1, 1 앞은 45', wrap(46) === 1 && wrap(0) === 45)
}

/* ── 실제 원국 한 사람(1994-05-12 07시 서울) ───────────────────── */
{
  const profile = {
    year: '1994',
    month: '05',
    day: '12',
    time: '07',
    calendar: 'solar',
    gender: '',
    name: '',
  }
  const zones = {
    now: Date.UTC(2026, 9, 23, 3),
    zone: 'Asia/Seoul',
    birthZone: 'Asia/Seoul',
  }
  const a = luckyDraw(profile, zones)
  const b = luckyDraw(profile, zones)
  check(
    '같은 입력이면 같은 번호',
    a.orbit.numbers.join() === b.orbit.numbers.join()
  )
  check(
    '2026-10-23 경오일 예시: 02 03 16 17 29 42',
    a.orbit.numbers.join() === '2,3,16,17,29,42',
    a.orbit.numbers.join()
  )
  check(
    '예시: 출발 칸 7(경오는 7번째)',
    a.orbit.start === 7,
    `${a.orbit.start}`
  )
  const later = luckyDraw(profile, { ...zones, now: zones.now + 5 * 3600e3 })
  check(
    '같은 날 다른 시각에도 같은 번호',
    later.orbit.numbers.join() === a.orbit.numbers.join()
  )
}

/* ── 무작위 원국: 규칙과 분포 ─────────────────────────────────── */
{
  const N = 60000
  const freq = new Array(TOTAL + 1).fill(0)
  const combos = new Set()
  let same = 0
  let ruleFail = null
  for (let i = 0; i < N; i++) {
    const chart = randomChart(rnd() < 0.5)
    const yong = pick(5)
    const t = pick(60)
    const o = orbit(chart, pillarAt(t), yong)
    const next = orbit(chart, pillarAt(t + 1), yong)
    const gi = giOf(yong)
    o.numbers.forEach((n) => freq[n]++)
    combos.add(o.numbers.join())
    if (o.numbers.join() === next.numbers.join()) same++
    if (ruleFail) continue
    if (o.numbers.length !== PICK || new Set(o.numbers).size !== PICK)
      ruleFail = `여섯 개가 서로 다르지 않음: ${o.numbers}`
    else if (o.numbers.some((n, k) => k && n <= o.numbers[k - 1]))
      ruleFail = `정렬 안 됨: ${o.numbers}`
    else if (o.numbers.some((n) => cellElement(n) === gi))
      ruleFail = `기신 칸이 나옴: ${o.numbers} (기신 ${gi})`
    else if (o.moves.filter((m) => !m.land).length !== (chart.hour ? 2 : 0))
      ruleFail = '시주 걸음 수가 틀림'
    else
      for (const m of o.moves) {
        const el =
          m.side === 'stem' ? stemElement(m.index) : branchElement(m.index)
        const dir = relation(cellElement(m.from), el) === 'clash' ? -1 : 1
        const plain = wrap(m.from + dir * m.steps)
        const end = wrap(plain + dir * m.skipped.length)
        if (
          m.dir !== dir ||
          m.el !== el ||
          m.to !== end ||
          m.path.length !== m.steps + m.skipped.length
        ) {
          ruleFail = `걸음 기록이 규칙과 다름: ${JSON.stringify(m)}`
          break
        }
      }
  }
  check('무작위 원국: 걸음 규칙·여섯 개·기신 제외', !ruleFail, ruleFail ?? '')
  const avg = (N * PICK) / TOTAL
  const lo = Math.min(...freq.slice(1)) / avg
  const hi = Math.max(...freq.slice(1)) / avg
  check(
    '번호별 빈도: 평균의 0.9–1.1배',
    lo > 0.9 && hi < 1.1,
    `${lo.toFixed(3)}–${hi.toFixed(3)}`
  )
  check(
    '서로 다른 조합이 90% 넘음',
    combos.size / N > 0.9,
    `${((combos.size / N) * 100).toFixed(1)}%`
  )
  check(
    '다음 날과 똑같은 번호는 0.5% 미만',
    same / N < 0.005,
    `${((same / N) * 100).toFixed(3)}%`
  )
}

/* ── 그냥 뽑기 ─────────────────────────────────────────────── */
{
  const N = 90000
  const freq = new Array(TOTAL + 1).fill(0)
  let bad = null
  for (let i = 0; i < N; i++) {
    const g = drawRandom()
    g.numbers.forEach((n) => freq[n]++)
    if (!bad && (g.numbers.length !== PICK || new Set(g.order).size !== PICK))
      bad = `${g.order}`
  }
  check('그냥 뽑기: 서로 다른 여섯 개', !bad, bad ?? '')
  const exp = (N * PICK) / TOTAL
  const chi = freq.slice(1).reduce((s, f) => s + (f - exp) ** 2 / exp, 0)
  /* 자유도 44, 유의수준 0.001의 임계값 78.75 */
  check(
    '그냥 뽑기: 고른 분포(카이제곱 < 78.75)',
    chi < 78.75,
    `카이제곱 ${chi.toFixed(1)}`
  )

  let rule = null
  for (let i = 0; i < 5000 && !rule; i++) {
    const fixed = [7, 21, 33]
    const excluded = [1, 2, 3, 12, 44]
    const g = drawRandom({ fixed, excluded })
    if (!fixed.every((f) => g.numbers.includes(f)))
      rule = `고정수 빠짐: ${g.numbers}`
    else if (g.numbers.some((n) => excluded.includes(n)))
      rule = `제외수 들어감: ${g.numbers}`
  }
  check('그냥 뽑기: 고정은 넣고 제외는 뺀다', !rule, rule ?? '')
  const most = Array.from({ length: MAX_EXCLUDED }, (_, i) => i + 1)
  const g = drawRandom({ excluded: most })
  check(
    '제외를 최대(39개)로 해도 여섯 개가 나온다',
    g.numbers.join() === '40,41,42,43,44,45',
    g.numbers.join()
  )
}

/* ── 추첨일 ─────────────────────────────────────────────────── */
{
  const kst = (y, m, d, h) => Date.UTC(y, m - 1, d, h - 9)
  const fri = nextDraw(kst(2026, 10, 23, 12))
  check(
    '금요일이면 다음 날 토요일',
    fri.m === 10 && fri.d === 24 && fri.days === 1,
    JSON.stringify(fri)
  )
  const satBefore = nextDraw(kst(2026, 10, 24, 19))
  check(
    '토요일 20시 전이면 오늘',
    satBefore.d === 24 && satBefore.days === 0,
    JSON.stringify(satBefore)
  )
  const satAfter = nextDraw(kst(2026, 10, 24, 21))
  check(
    '토요일 20시 뒤면 다음 주',
    satAfter.d === 31 && satAfter.days === 7,
    JSON.stringify(satAfter)
  )
}

console.log(`로또 검증: ${pass}개 통과, ${fails.length}개 실패`)
for (const f of fails) console.log(`  ✗ ${f}`)
process.exit(fails.length ? 1 : 0)
