import KoreanLunarCalendar from 'korean-lunar-calendar'

/** 한국천문연구원 자료 기반의 음력. 1000–2050년(양력 2050-11-18까지)을 다룬다. */
let calendar: KoreanLunarCalendar | null = null

/** 음력 날짜를 양력으로. 없는 날(30일이 없는 달, 윤달이 없는 해 등)이면 null. */
export function lunarToSolar(y: number, m: number, d: number, leap: boolean) {
  calendar ??= new KoreanLunarCalendar()
  if (!calendar.setLunarDate(y, m, d, leap)) return null
  const s = calendar.getSolarCalendar()
  return { y: s.year, m: s.month, d: s.day }
}
