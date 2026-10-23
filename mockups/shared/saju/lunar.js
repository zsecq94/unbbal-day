/* lib/saju/lunar.ts에서 생성됨(mockups/tools/build-saju.mjs) */
import KoreanLunarCalendar from '../../../node_modules/korean-lunar-calendar/dist/korean-lunar-calendar.mjs'

/** 한국천문연구원 자료 기반의 음력. 1000–2050년(양력 2050-11-18까지)을 다룬다. */
let calendar                             = null

/** 음력 날짜를 양력으로. 없는 날(30일이 없는 달, 윤달이 없는 해 등)이면 null. */
export function lunarToSolar(y        , m        , d        , leap         ) {
  calendar ??= new KoreanLunarCalendar()
  if (!calendar.setLunarDate(y, m, d, leap)) return null
  const s = calendar.getSolarCalendar()
  return { y: s.year, m: s.month, d: s.day }
}
