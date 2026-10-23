/* lib/saju/terms.ts에서 생성됨(mockups/tools/build-saju.mjs) */
import {
  TERMS_BASE,
  TERMS_FIRST_YEAR,
  TERMS_PACKED,
  TERMS_START,
} from './solar-terms-data.js'

/** 12절의 UTC 시각(분). 번호 i는 TERMS_FIRST_YEAR + i/12년의 (i%12)번째 절(0 = 소한). */
let table                  = null
function terms() {
  if (table) return table
  const out = [TERMS_START]
  for (let i = 0; i < TERMS_PACKED.length; i += 3)
    out.push(
      out[out.length - 1] +
        TERMS_BASE +
        parseInt(TERMS_PACKED.slice(i, i + 3), 36)
    )
  return (table = out)
}

/** 그 순간 이미 들어선 마지막 절. 사주의 해와 달이 여기서 정해진다. */
export function termAt(utcMs        ) {
  const t = terms()
  const min = utcMs / 60000
  let lo = 0
  let hi = t.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (t[mid] <= min) lo = mid
    else hi = mid - 1
  }
  const year = TERMS_FIRST_YEAR + Math.floor(lo / 12)
  const index = lo % 12
  return {
    /** 0 소한, 1 입춘 … 11 대설 */
    index,
    /** 입춘 전이면 전해 */
    sajuYear: index >= 1 ? year : year - 1,
    /** 소한이 축월, 입춘이 인월 … 대설이 자월 */
    monthBranch: (index + 1) % 12,
  }
}

/** [from, to) 사이에 절입이 있는가 */
export function termBetween(fromMs        , toMs        ) {
  const t = terms()
  return t.some((m) => m * 60000 >= fromMs && m * 60000 < toMs)
}
