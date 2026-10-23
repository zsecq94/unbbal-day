/* ───────────────────────────────────────────────────────────────
   운빨데이 · 로또 시안 공용 엔진(ES 모듈)
   - 상생 궤도: 원국과 오늘 일진으로 1–45 원을 걸어 번호 여섯 개를 고른다.
   - 그냥 뽑기: crypto 균등 추출(고정수·제외수).
   - 추첨일, 간지·오행 이름, 공 색.
   사주 계산은 mockups/shared/saju/(lib/saju에서 생성)를 그대로 쓴다.
   ─────────────────────────────────────────────────────────────── */
import { birthChart, todayOf } from './saju/chart.js'
import { readDay } from './saju/reading.js'
import { lunarToSolar } from './saju/lunar.js'
import { stemElement, branchElement } from './saju/ganji.js'

/* 시안이 오늘 일진을 미리 보여 줄 때 쓴다 */
export { todayOf }

export const STEMS = '갑을병정무기경신임계'
export const STEMS_HANJA = '甲乙丙丁戊己庚辛壬癸'
export const BRANCHES = '자축인묘진사오미신유술해'
export const BRANCHES_HANJA = '子丑寅卯辰巳午未申酉戌亥'
/** 오행 순서: 목화토금수 */
export const ELEMENTS = ['목', '화', '토', '금', '수']
export const ELEMENTS_HANJA = ['木', '火', '土', '金', '水']
export const PILLARS = { hour: '시', year: '년', month: '월', day: '일' }

/** 하도(河圖) 수: 끝자리 → 오행. 1·6 수, 2·7 화, 3·8 목, 4·9 금, 5·0 토 */
const HADO = [2, 4, 1, 0, 3, 2, 4, 1, 0, 3]
export const cellElement = (n) => HADO[n % 10]
/** 오행별 하도 끝자리 */
export const HADO_DIGITS = ['3·8', '2·7', '5·0', '4·9', '1·6']
/** 오행별 번호 묶음(9개씩) */
export const POOLS = ELEMENTS.map((_, e) =>
  Array.from({ length: 45 }, (_, i) => i + 1).filter((n) => cellElement(n) === e)
)

export const TOTAL = 45
export const PICK = 6
export const ODDS = 8145060
export const wrap = (c) => ((((c - 1) % TOTAL) + TOTAL) % TOTAL) + 1
export const pad2 = (n) => String(n).padStart(2, '0')

/** a(지금 칸)와 b(글자)의 관계 */
export function relation(a, b) {
  return ['same', 'gen', 'clash', 'clash', 'gen'][(b - a + 5) % 5]
}
export const RELATION_KO = { same: '같은 기운', gen: '상생', clash: '상극' }

export const ganji = (p) => STEMS[p.stem] + BRANCHES[p.branch]
export const ganjiHanja = (p) => STEMS_HANJA[p.stem] + BRANCHES_HANJA[p.branch]
/** 60갑자 순번(0 = 갑자) */
export const sexagenary = (p) => {
  for (let n = 0; n < 60; n++) if (n % 10 === p.stem && n % 12 === p.branch) return n
  return 0
}

/**
 * 상생 궤도.
 * 1. 1–45를 원 둘레에 놓는다. 칸의 오행은 하도 끝자리로 정한다.
 * 2. 출발점은 오늘 일진의 60갑자 순번(1부터)을 45로 나눈 나머지 칸이다.
 * 3. 시주를 알면 시간·시지만큼 먼저 걸어 출발점을 옮긴다(공은 놓지 않는다).
 * 4. 원국의 년·월·일 여섯 글자로 한 번씩 걷고, 걸을 때마다 공 하나를 놓는다.
 *    걸음 수 = 글자 번호(천간 1–10, 지지 1–12) + 오늘 일진의 같은 쪽 글자 번호.
 * 5. 지금 칸의 오행과 글자의 오행이 상극이면 반시계, 아니면 시계 방향이다.
 * 6. 기신 칸이나 뽑힌 칸에 내리면 같은 방향으로 한 칸씩 더 간다.
 */
export function orbit(chart, today, yong) {
  const gi = (yong + 3) % 5
  const startIndex = sexagenary(today)
  let pos = (startIndex % TOTAL) + 1
  const start = pos
  const taken = new Set()
  const moves = []
  const walk = (pillar, side, plus, land) => {
    const p = chart[pillar]
    const value = side === 'stem' ? p.stem + 1 : p.branch + 1
    const el = side === 'stem' ? stemElement(p.stem) : branchElement(p.branch)
    const char = side === 'stem' ? STEMS[p.stem] : BRANCHES[p.branch]
    const hanja = side === 'stem' ? STEMS_HANJA[p.stem] : BRANCHES_HANJA[p.branch]
    const from = pos
    const rel = relation(cellElement(from), el)
    const dir = rel === 'clash' ? -1 : 1
    const steps = value + plus
    /* 지나가는 칸(내려앉는 칸 포함) */
    const path = Array.from({ length: steps }, (_, i) => wrap(from + dir * (i + 1)))
    pos = wrap(from + dir * steps)
    const skipped = []
    if (land) {
      while (taken.has(pos) || cellElement(pos) === gi) {
        skipped.push({ cell: pos, why: taken.has(pos) ? 'taken' : 'gi' })
        pos = wrap(pos + dir)
        path.push(pos)
      }
      taken.add(pos)
    }
    moves.push({
      pillar, side, char, hanja, el, value, plus, steps, from, to: pos,
      fromEl: cellElement(from), rel, dir, path, skipped, land,
    })
  }
  if (chart.hour) {
    walk('hour', 'stem', 0, false)
    walk('hour', 'branch', 0, false)
  }
  for (const pillar of ['year', 'month', 'day']) {
    walk(pillar, 'stem', today.stem + 1, true)
    walk(pillar, 'branch', today.branch + 1, true)
  }
  const picks = moves.filter((m) => m.land).map((m) => m.to)
  return {
    start,
    startIndex,
    gi,
    moves,
    picks,
    numbers: [...picks].sort((a, b) => a - b),
  }
}

/* ─── 입력 → 원국 ─────────────────────────────────────────── */

export const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

/** 입력의 양력 날짜. 음력이면 바꾸고 없는 날이면 null */
export function solarOf({ y, m, d, calendar }) {
  if (!(y >= 1900) || !(m >= 1 && m <= 12) || !(d >= 1)) return null
  if (calendar === 'lunar' || calendar === 'leap') return lunarToSolar(y, m, d, calendar === 'leap')
  return d <= new Date(y, m, 0).getDate() ? { y, m, d } : null
}

/** `HH` 또는 `HH:MM` */
export function timeOf(text) {
  const m = String(text || '').match(/^(\d{1,2})(?::?(\d{2}))?$/)
  if (!m || +m[1] > 23 || (m[2] && +m[2] > 59)) return null
  return { h: +m[1], min: m[2] ? +m[2] : 0 }
}

/**
 * 생년월일(시각·양음력 선택)로 오늘의 궤도까지 한 번에 계산한다.
 * 한국어 화면이면 태어난 곳을 서울로 본다(앱의 zonesFor와 같다).
 */
export function fortuneDraw(input, { now = Date.now(), zone = localZone(), birthZone = 'Asia/Seoul' } = {}) {
  const solar = solarOf(input)
  if (!solar) return null
  if (new Date(solar.y, solar.m - 1, solar.d) > new Date(now)) return null
  const chart = birthChart(solar, timeOf(input.time), birthZone)
  const today = todayOf(now, zone)
  const reading = readDay(chart, today, '')
  const money = reading.domains.find((d) => d.key === 'money')
  return {
    solar,
    chart,
    today,
    yong: reading.yong,
    hee: (reading.yong + 4) % 5,
    elements: reading.elements,
    money: money ? money.score : null,
    best: reading.best,
    orbit: orbit(chart, today.day, reading.yong),
  }
}

/* ─── 그냥 뽑기 ───────────────────────────────────────────── */

/** 0 ≤ x < n 균등 정수(거절 샘플링) */
function uniform(n) {
  const limit = Math.floor(0x100000000 / n) * n
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit)
  return buf[0] % n
}

/** 고정수를 넣고, 제외수를 뺀 나머지에서 균등하게 채운다. 뽑힌 순서대로 돌려준다 */
export function drawRandom({ fixed = [], excluded = [] } = {}) {
  const pool = []
  for (let n = 1; n <= TOTAL; n++) if (!fixed.includes(n) && !excluded.includes(n)) pool.push(n)
  const order = []
  const need = PICK - fixed.length
  for (let i = 0; i < need; i++) order.push(pool.splice(uniform(pool.length), 1)[0])
  /* 고정수도 추첨 순서 안에 무작위 자리로 섞는다 */
  const all = [...order]
  for (const f of fixed) all.splice(uniform(all.length + 1), 0, f)
  return { order: all, numbers: [...all].sort((a, b) => a - b), fixed: [...fixed] }
}
export const GAME_LABELS = ['A', 'B', 'C', 'D', 'E']
export const MAX_FIXED = 5
/** 제외하고 남은 칸이 여섯 개는 돼야 한다(고정수도 여섯 안에 든다) */
export const MAX_EXCLUDED = TOTAL - PICK

/* ─── 추첨일 ──────────────────────────────────────────────── */

/** 서울 기준 다음 추첨일(토요일). 토요일 20시 판매 마감 뒤면 다음 주 */
export function nextDraw(now = Date.now()) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false, weekday: 'short',
  })
  const parts = Object.fromEntries(f.formatToParts(now).map((p) => [p.type, p.value]))
  const w = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  let add = (6 - w + 7) % 7
  if (add === 0 && +parts.hour >= 20) add = 7
  const d = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day + add))
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), days: add }
}

/* ─── 공 색 ───────────────────────────────────────────────── */

/** 실제 로또 6/45 공 색(번호대별) */
export function rangeColor(n) {
  if (n <= 10) return 'yellow'
  if (n <= 20) return 'blue'
  if (n <= 30) return 'red'
  if (n <= 40) return 'gray'
  return 'green'
}
/** 오행 색 */
export const ELEMENT_COLORS = ['wood', 'fire', 'earth', 'metal', 'water']
export const elementColor = (n) => ELEMENT_COLORS[cellElement(n)]

/** 데모 입력 */
export const DEMO = { y: 1994, m: 5, d: 12, time: '07', calendar: 'solar' }

/* ─── 시안 도우미 ─────────────────────────────────────────── */

/** 공 하나의 마크업. 공 색 스킴은 html[data-balls]가 정한다 */
export function ballHTML(n, { cls = '', attrs = '', tag = 'span' } = {}) {
  const type = tag === 'button' ? ' type="button"' : ''
  return `<${tag}${type} class="ball ${cls}" data-range="${rangeColor(n)}" data-el="${elementColor(n)}" ${attrs}>${pad2(n)}</${tag}>`
}

/** 공 색 스킴: ?balls=lotto|element|mono, 데스크톱 오른쪽 아래 스위치로 바꿔 본다 */
export function ballScheme(initial = 'lotto') {
  const html = document.documentElement
  const q = new URLSearchParams(location.search).get('balls')
  html.dataset.balls = q || initial
  const box = document.createElement('div')
  box.className = 'ball-scheme'
  box.setAttribute('aria-hidden', 'true')
  box.innerHTML = ['lotto', 'element', 'mono']
    .map((k) => `<button type="button" tabindex="-1" data-k="${k}">${k}</button>`)
    .join('')
  const sync = () =>
    box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === html.dataset.balls)))
  box.addEventListener('click', (e) => {
    const k = e.target.closest('button')?.dataset.k
    if (k) {
      html.dataset.balls = k
      sync()
    }
  })
  sync()
  /* 상단바의 언어 칩 앞에 둔다(화면 위에 떠 있으면 아래쪽 버튼과 겹친다) */
  const locale = document.querySelector('.topbar .locale')
  if (locale) locale.before(box)
  else document.body.appendChild(box)
}

/** 클립보드용 텍스트: `A 03 12 18 27 33 41` */
export const ticketText = (games) =>
  games.map((g, i) => `${GAME_LABELS[i]} ${g.map(pad2).join(' ')}`).join('\n')

/** 로또 심볼(components/game-symbol.tsx의 lotto) */
export const LOTTO_SYMBOL =
  '<circle cx="24" cy="13" r="7"/><circle cx="13" cy="32" r="7"/><circle class="f" cx="35" cy="32" r="7"/><circle cx="35" cy="32" r="7"/>'
