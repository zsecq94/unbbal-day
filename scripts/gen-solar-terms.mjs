/**
 * 절기(12절) 시각 표를 만든다. 결과는 lib/saju/solar-terms-data.ts.
 * 기준 계산은 lunar-javascript(寿星 천문 알고리즘, 베이징 시각)이고 UTC로 바꿔 담는다.
 *
 *   node scripts/gen-solar-terms.mjs
 */
import { writeFileSync } from 'node:fs'
import { Lunar } from 'lunar-javascript'

const FIRST = 1899
const LAST = 2100
/** 각 해의 12절. 소한(1월)부터 대설(12월)까지. */
const JIE = [
  '小寒',
  '立春',
  '惊蛰',
  '清明',
  '立夏',
  '芒种',
  '小暑',
  '立秋',
  '白露',
  '寒露',
  '立冬',
  '大雪',
]
const BASE = 42000

const minutes = []
for (let y = FIRST; y <= LAST; y++) {
  const table = Lunar.fromYmd(y, 6, 1).getJieQiTable()
  for (const name of JIE) {
    const s = table[name]
    if (s.getYear() !== y) throw new Error(`${y} ${name}: ${s.toYmdHms()}`)
    const utc =
      Date.UTC(
        s.getYear(),
        s.getMonth() - 1,
        s.getDay(),
        s.getHour() - 8,
        s.getMinute(),
        s.getSecond()
      ) / 60000
    minutes.push(Math.round(utc))
  }
}

let packed = ''
for (let i = 1; i < minutes.length; i++) {
  const d = minutes[i] - minutes[i - 1] - BASE
  if (d < 0 || d >= 36 ** 3) throw new Error(`delta out of range at ${i}`)
  packed += d.toString(36).padStart(3, '0')
}

const lines = packed.match(/.{1,72}/g).map((l) => `  '${l}'`)
writeFileSync(
  new URL('../lib/saju/solar-terms-data.ts', import.meta.url),
  `// scripts/gen-solar-terms.mjs가 만든 파일이다. 직접 고치지 않는다.

/** 표의 첫 해. 이 해의 소한부터 시작한다. */
export const TERMS_FIRST_YEAR = ${FIRST}
/** 표의 마지막 해. 이 해의 대설까지 들어 있다. */
export const TERMS_LAST_YEAR = ${LAST}
/** 첫 절기(소한)의 UTC 시각, 1970년부터 센 분 */
export const TERMS_START = ${minutes[0]}
/** 이웃한 절기 사이 분에서 뺀 값 */
export const TERMS_BASE = ${BASE}
/** 이웃한 절기 사이 분 - TERMS_BASE를 36진수 세 자리씩 이어 붙였다 */
export const TERMS_PACKED =
${lines.join(' +\n')}
`
)
console.log(`${minutes.length} terms, ${packed.length} chars`)
