/* lib/saju/time.ts에서 생성됨(mockups/tools/build-saju.mjs) */
/**
 * 시간대 계산. 과거 표준시 변경과 서머타임은 브라우저의 tz 데이터(Intl)를 따른다.
 * 사주의 날과 시는 시계 시각이 아니라 태양시로 본다.
 */

const SEOUL = 'Asia/Seoul'
/** 한국은 동경 127.5도 태양시(UTC+8:30)로 본다. 자시가 23:30에 시작하는 관례와 같다. */
const SEOUL_SOLAR = 510

const formats = new Map                             ()
function format(timeZone        ) {
  let f = formats.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
    formats.set(timeZone, f)
  }
  return f
}

                                                                              

function parts(timeZone        , utcMs        ) {
  const p                         = {}
  for (const part of format(timeZone).formatToParts(utcMs))
    if (part.type !== 'literal') p[part.type] = +part.value
  return p
}

/** 그 순간 그 시간대의 벽시계 */
export function wallAt(timeZone        , utcMs        )       {
  const p = parts(timeZone, utcMs)
  return { y: p.year, m: p.month, d: p.day, h: p.hour, min: p.minute }
}

/** 그 순간 UTC와의 차이(분). 1908년 이전 지방평균시(+8:27:52)처럼 초 단위도 있다. */
export function zoneOffset(timeZone        , utcMs        ) {
  const p = parts(timeZone, utcMs)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return (asUtc - Math.floor(utcMs / 1000) * 1000) / 60000
}

/** 벽시계 시각을 UTC로. 서머타임으로 겹치거나 빈 시각은 앞쪽 해석을 쓴다. */
export function wallToUtc(timeZone        , w      ) {
  const asUtc = Date.UTC(w.y, w.m - 1, w.d, w.h, w.min)
  let utc = asUtc - zoneOffset(timeZone, asUtc) * 60000
  utc = asUtc - zoneOffset(timeZone, utc) * 60000
  return utc
}

/** 그 순간의 태양시 오프셋(분). 서울은 고정값, 다른 곳은 서머타임을 뺀 표준시로 본다. */
export function solarOffset(timeZone        , utcMs        ) {
  if (timeZone === SEOUL) return SEOUL_SOLAR
  const y = new Date(utcMs).getUTCFullYear()
  return Math.min(
    zoneOffset(timeZone, Date.UTC(y, 0, 1)),
    zoneOffset(timeZone, Date.UTC(y, 6, 1))
  )
}

/** 방문자 브라우저의 시간대 */
export const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
