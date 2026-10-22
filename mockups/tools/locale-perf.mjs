/* 언어 전환 성능·상태 검사.
   헤드리스 크롬에서 대상마다 데스크톱(1440×900)·모바일(390×844, DPR 3, 터치)
   크기, KO→EN·EN→KO 양방향으로 다음을 한다.
   1) 측정: CPU 4배 감속을 걸고 언어 버튼을 눌러 트레이스를 뜬다.
      - 전환 중 20ms를 넘는 프레임 수: 컴포지터가 화면에 낸 프레임(DrawFrame)
        사이 간격, 그리고 메인 스레드 프레임(AnimationFrame) 길이
      - 컴포지터로 못 넘어간 애니메이션과 그 이유(Animation 이벤트의 compositeFailed)
      - 전환 중 Paint·Layout 횟수(준비 구간 click→ready, 애니메이션 구간 ready→end)
      - 전환 시작 지연: click 디스패치 → 애니메이션이 처음 그려진 프레임
   2) 캡처: 감속 없이 누른 뒤 모든 전환 애니메이션을 정해진 시각에 멈춰 찍고,
      한 장짜리 시트로 묶는다.
   3) 끝난 상태: 문구, 남은 view-transition-name, 도는 애니메이션, 가로 넘침,
      JS 오류. 동작 줄이기에서는 움직이는 것 없이 바로 바뀌는지 본다.
   대상: instant(시안 허브를 전환 없이 바꾸는 기준선), locale-coin(시안).
   --app=URL을 주면 앱(next start)의 허브(app), 준비 중 게임 페이지(app-game, 전환만),
   운세 페이지(app-fortune, 화면 자체 애니메이션 포함)도 잰다.
   앱의 끝난 상태는 같은 언어로 새로 연 화면과 본문 글자를 비교한다.
   사용: node locale-perf.mjs [대상 필터] [--runs=3] [--shots=DIR] [--app=URL]
         [--skip=measure,capture,reduced] [--keep-traces]
   puppeteer-core는 저장소 밖(/tmp/mock-tools)에 설치한다(run.sh 참고). */
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const require = createRequire('/tmp/mock-tools/package.json')
const puppeteer = require('puppeteer-core')

const BASE = process.env.MOCK_BASE || 'http://127.0.0.1:8765/mockups/'
const args = process.argv.slice(2)
const opt = (k) => (args.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3)
const filter = args.find((a) => !a.startsWith('--')) || ''
const RUNS = Number(opt('runs')) || 3
const SHOTS = opt('shots') || '/tmp/mock-shots/locale'
const APP = opt('app')
const SKIP = (opt('skip') || '').split(',')
const KEEP_TRACES = args.includes('--keep-traces')
mkdirSync(SHOTS, { recursive: true })

/* instant: 같은 허브를 전환 없이 바로 바꾸는 기준선(시작 지연 비교용) */
const SAMPLES = ['instant', 'locale-coin', ...(APP ? ['app', 'app-game', 'app-fortune'] : [])].filter((s) =>
  s.includes(filter)
)
const isApp = (sample) => sample.startsWith('app')
const SIZES = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
}
const DIRS = [
  ['ko', 'en'],
  ['en', 'ko'],
]
const FRAMES = [0, 60, 120, 180, 240, 320, 420, 560]
const SEED = 7
/* 가볍게: disabled-by-default-devtools.timeline을 켜면 4배 감속에서 지연이 크게
   부풀었다. Animation 이벤트(합성 실패 이유)는 devtools.timeline에도 실린다 */
const CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
  'blink.user_timing',
]

/* Chromium CompositorAnimations::FailureReason 비트 */
const REASONS = {
  0: '가속 꺼짐',
  1: 'DevTools가 막음',
  2: '애니메이션/효과가 유효하지 않음',
  3: '지원하지 않는 타이밍',
  4: 'composite가 replace가 아님',
  5: '대상의 합성 상태가 맞지 않음',
  6: '같은 대상에 합성할 수 없는 애니메이션이 함께 있음',
  7: '대상에 CSS offset',
  9: 'CSS가 아닌 속성',
  10: '대상에서 transform 계열을 가속할 수 없음',
  11: 'transform이 박스 크기에 의존',
  12: 'filter가 픽셀을 옮김',
  13: '컴포지터가 지원하지 않는 속성',
  15: '키프레임 값 타입이 섞임',
  16: '타임라인 소스가 합성되지 않음',
  17: '합성 속성이지만 효과 없음(최적화로 빠짐)',
  18: '!important 속성',
  19: 'SVG 대상의 개별 transform',
}
const BENIGN = 1 << 17
const decode = (flags) =>
  Object.keys(REASONS)
    .filter((b) => flags & (1 << b))
    .map((b) => REASONS[b])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null
}
const round = (x, d = 0) => (x == null ? null : Number(x.toFixed(d)))

/* ── 대상별 주소와 버튼 ── */
function target(sample, from, to) {
  if (sample === 'app') return { url: `${APP}/${from}`, button: `a[hreflang="${to}"]` }
  if (sample === 'app-game') return { url: `${APP}/${from}/games/pinball`, button: `a[hreflang="${to}"]` }
  if (sample === 'app-fortune') return { url: `${APP}/${from}/games/fortune`, button: `a[hreflang="${to}"]` }
  if (sample === 'instant')
    return { url: `${BASE}locale-coin.html?lang=${from}&instant`, button: `.hero-locale [data-lang="${to}"]` }
  return {
    url: `${BASE}${sample}.html?lang=${from}&seed=${SEED}`,
    button: `.hero-locale [data-lang="${to}"]`,
  }
}

/* 앱에는 시안 도우미가 없으므로 같은 시각 기록을 심는다. maxEnd는 전환
   애니메이션 중 가장 늦게 끝나는 시각(동작 줄이기에서는 0이어야 한다) */
const APP_OBSERVER = `(() => {
  const lt = (window.__lt = { runs: 0, state: 'idle', seek: null })
  addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('[hreflang]')) return
    Object.assign(lt, { state: 'running', click: e.timeStamp, start: performance.now(), ready: null, firstFrame: null, end: null })
    performance.mark('lt:start')
  }, true)
  const start = document.startViewTransition.bind(document)
  document.startViewTransition = (arg) => {
    const vt = start(arg)
    if (lt.state !== 'running') return vt
    lt.seek = (ms) => {
      for (const a of document.documentElement.getAnimations({ subtree: true }))
        if (a.effect && a.effect.pseudoElement && a.effect.pseudoElement.startsWith('::view-transition')) { a.pause(); a.currentTime = ms }
    }
    vt.ready.then(() => {
      lt.ready = performance.now()
      performance.mark('lt:ready')
      lt.maxEnd = Math.max(0, ...document.documentElement.getAnimations({ subtree: true })
        .filter((a) => a.effect && a.effect.pseudoElement && a.effect.pseudoElement.startsWith('::view-transition'))
        .map((a) => a.effect.getComputedTiming().endTime))
      requestAnimationFrame((t) => (lt.firstFrame = t))
    }, () => {})
    vt.finished.finally(() => { lt.end = performance.now(); performance.mark('lt:end'); lt.state = 'done'; lt.runs++; lt.seek = null })
    return vt
  }
})()`

async function openPage(browser, sample, url, size, { reduced = false } = {}) {
  const page = await browser.newPage()
  await page.setViewport(size)
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  if (isApp(sample)) await page.evaluateOnNewDocument(APP_OBSERVER)
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await page.bringToFront()
  /* 앱: 언어 링크 프리페치가 끝나도록 */
  await sleep(isApp(sample) ? 1200 : 400)
  return { page, errors }
}

async function press(page, selector, size) {
  if (size.hasTouch) await page.tap(selector)
  else await page.click(selector)
}

const waitDone = (page) =>
  page.waitForFunction(() => window.__lt && window.__lt.state === 'done', { timeout: 15000 })

/* ── 트레이스 분석 ── */
function analyze(trace) {
  const ev = trace.traceEvents || trace
  const last = (n) => ev.filter((e) => e.name === n).pop()
  const mStart = last('lt:start')
  const mReady = last('lt:ready')
  const mEnd = last('lt:end')
  if (!mStart || !mReady || !mEnd) return { error: '마크 없음' }
  const pid = mStart.pid
  const main = mStart.tid
  const threadName = (tid) =>
    (ev.find((e) => e.ph === 'M' && e.name === 'thread_name' && e.pid === pid && e.tid === tid) || {}).args?.name
  const comp = ev.find((e) => e.ph === 'M' && e.name === 'thread_name' && e.pid === pid && e.args.name === 'Compositor')?.tid
  const click = ev
    .filter((e) => e.name === 'EventDispatch' && e.pid === pid && e.args?.data?.type === 'click' && e.ts <= mStart.ts + 1)
    .pop()
  const t0 = click ? click.ts : mStart.ts
  const tReady = mReady.ts
  const tEnd = mEnd.ts
  const inRange = (e, a, b) => e.ts >= a && e.ts <= b

  /* 컴포지터가 낸 프레임 */
  const draws = ev
    .filter((e) => e.pid === pid && e.tid === comp && e.name === 'DrawFrame')
    .map((e) => e.ts)
    .sort((a, b) => a - b)
  const firstDraw = draws.find((ts) => ts >= tReady)
  const animDraws = draws.filter((ts) => ts >= (firstDraw ?? tReady) && ts <= tEnd)
  const gaps = animDraws.slice(1).map((ts, i) => (ts - animDraws[i]) / 1000)
  const dropped = ev.filter((e) => e.pid === pid && e.name === 'DroppedFrame' && inRange(e, tReady, tEnd)).length

  /* 메인 스레드 프레임(LoAF와 같은 묶음) */
  const open = new Map()
  const mainFrames = []
  for (const e of ev) {
    if (e.pid !== pid || e.name !== 'AnimationFrame') continue
    const id = e.id2?.local ?? e.id
    if (e.ph === 'b') open.set(id, e.ts)
    else if (e.ph === 'e' && open.has(id)) {
      const b = open.get(id)
      open.delete(id)
      if (e.ts >= t0 && b <= tEnd) mainFrames.push((e.ts - b) / 1000)
    }
  }

  const onMain = (n, a, b) => ev.filter((e) => e.pid === pid && e.tid === main && e.name === n && inRange(e, a, b)).length
  /* 첫 애니메이션 프레임 뒤에도 Paint가 든 메인 프레임 수(매 프레임 페인트인지 보려고) */
  const tFirst = firstDraw ?? tReady
  const frameStarts = ev
    .filter((e) => e.pid === pid && e.name === 'BeginMainThreadFrame' && inRange(e, tFirst, tEnd))
    .map((e) => e.ts)
    .sort((a, b) => a - b)
  const paintFrames = new Set(
    ev
      .filter((e) => e.pid === pid && e.tid === main && e.name === 'Paint' && inRange(e, tFirst, tEnd))
      .map((e) => frameStarts.filter((t) => t <= e.ts).length)
  ).size

  /* 애니메이션 합성 실패 */
  const current = new Map()
  const anims = new Map()
  for (const e of ev) {
    if (e.name !== 'Animation' || e.pid !== pid) continue
    const id = e.id2?.local ?? e.id
    if (e.ph === 'b') {
      const key = `${e.args.data.nodeName}|${e.args.data.displayName || e.args.data.name || ''}|${e.ts}`
      current.set(id, key)
      if (e.ts >= t0 - 1000 && e.ts <= tEnd) anims.set(key, { node: e.args.data.nodeName, name: e.args.data.displayName || e.args.data.name, flags: 0, props: new Set() })
    } else if (e.ph === 'n' && e.args?.data?.compositeFailed !== undefined) {
      const a = anims.get(current.get(id))
      if (!a) continue
      a.flags |= e.args.data.compositeFailed
      for (const p of e.args.data.unsupportedProperties || []) a.props.add(p)
    }
  }
  const failed = [...anims.values()].filter((a) => a.flags & ~BENIGN)
  return {
    thread: threadName(main),
    latency: firstDraw ? (firstDraw - t0) / 1000 : null,
    toReady: (tReady - t0) / 1000,
    duration: (tEnd - tReady) / 1000,
    frames: animDraws.length,
    longFrames: gaps.filter((g) => g > 20).length,
    maxGap: gaps.length ? Math.max(...gaps) : 0,
    dropped,
    mainLong: mainFrames.filter((d) => d > 20).length,
    mainMax: mainFrames.length ? Math.max(...mainFrames) : 0,
    paintSetup: onMain('Paint', t0, tFirst),
    paintAnim: onMain('Paint', tFirst + 1, tEnd),
    paintFrames,
    mainFrames: frameStarts.length,
    layoutAnim: onMain('Layout', tFirst + 1, tEnd),
    animations: anims.size,
    failedCount: failed.length,
    failed: failed.map((a) => ({ node: a.node, name: a.name, reasons: decode(a.flags & ~BENIGN), props: [...a.props] })),
  }
}

/* 비합성 애니메이션을 이름 패턴으로 묶는다 */
function groupFailed(list) {
  const out = new Map()
  for (const f of list) {
    const node = f.node.replace(/\(([a-z]+(?:-[a-z]+)?)-[^)]*\)/, '($1-*)')
    const key = `${node} ${f.name || ''} — ${f.reasons.join(', ')}${f.props.length ? ` [${f.props.join(', ')}]` : ''}`
    out.set(key, (out.get(key) || 0) + 1)
  }
  return [...out].map(([k, n]) => `${k} ×${n}`)
}

async function measure(browser, sample, sizeName, [from, to]) {
  const size = SIZES[sizeName]
  const { url, button } = target(sample, from, to)
  const runs = []
  for (let i = 0; i < RUNS; i++) {
    const { page, errors } = await openPage(browser, sample, url, size)
    const client = await page.createCDPSession()
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await sleep(300)
    const file = path.join(SHOTS, `trace-${sample}-${sizeName}-${from}-${to}-${i}.json`)
    await page.tracing.start({ path: file, categories: CATEGORIES })
    await press(page, button, size)
    await waitDone(page)
    await sleep(250)
    await page.tracing.stop()
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    const r = analyze(JSON.parse(readFileSync(file, 'utf8')))
    if (!KEEP_TRACES) unlinkSync(file)
    r.errors = errors
    runs.push(r)
    await page.close()
  }
  return runs
}

/* ── 캡처: 정해진 시각에 멈춰 찍는다 ── */
async function capture(browser, sample, sizeName, [from, to]) {
  const size = { ...SIZES[sizeName], deviceScaleFactor: 1 }
  const { url, button } = target(sample, from, to)
  const { page, errors } = await openPage(browser, sample, url, size)
  const tag = `${sample}-${sizeName}-${from}-${to}`
  const files = []
  await press(page, button, size)
  await page.waitForFunction(() => window.__lt && (window.__lt.ready || window.__lt.state === 'done'), { timeout: 15000 })
  const seekable = await page.evaluate(() => typeof window.__lt.seek === 'function' && window.__lt.state !== 'done')
  if (seekable) {
    for (const t of FRAMES) {
      await page.evaluate((ms) => window.__lt.seek(ms), t)
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const file = path.join(SHOTS, `${tag}-t${String(t).padStart(3, '0')}.png`)
      await page.screenshot({ path: file })
      files.push({ t, file })
    }
    await page.evaluate(() => {
      for (const a of document.getAnimations()) if (a.playState === 'paused') a.play()
    })
  }
  await waitDone(page)
  await sleep(300)
  const end = path.join(SHOTS, `${tag}-end.png`)
  await page.screenshot({ path: end })
  files.push({ t: 'end', file: end })
  const state = await finalState(page, sample, to)
  /* 같은 언어로 새로 연 화면과 비교한다(원래 있던 넘침과 구분, 앱은 본문 글자도) */
  const fresh = await openPage(browser, sample, target(sample, to, from).url, size)
  const baseline = await finalState(fresh.page, sample, to)
  await fresh.page.close()
  await page.close()
  return { files, state, baseline, errors }
}

async function finalState(page, sample, to) {
  return page.evaluate(
    (sample, to) => {
      const out = { lang: document.documentElement.lang, copy: [], leftover: 0, running: 0, hscroll: false, hoverflow: [] }
      const de = document.documentElement
      out.hscroll = de.scrollWidth > innerWidth + 1
      const clips = (el) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const cs = getComputedStyle(p)
          if (/hidden|clip/.test(cs.overflowX) || /hidden|clip/.test(cs.overflow)) return true
          if (cs.position === 'fixed') return false
        }
        return false
      }
      for (const el of document.body.querySelectorAll('*')) {
        if (el.closest('[hidden]')) continue
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) continue
        if ((r.right > innerWidth + 1 || r.left < -1) && !clips(el))
          out.hoverflow.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0])
        if (el.style.viewTransitionName) out.leftover++
      }
      out.running = document.getAnimations().filter((a) => a.playState === 'running').length
      if (sample !== 'app' && window.MockHub) {
        const c = window.MockHub.COPY[to]
        const h1 = document.querySelector('.hero h1')
        if (!h1 || h1.innerHTML !== c.hero.title) out.copy.push('hero h1')
        for (const t of document.querySelectorAll('.tile')) {
          const [name, desc] = c.games[t.dataset.key]
          if (t.querySelector('.tile-name').textContent !== name) out.copy.push('name ' + t.dataset.key)
          if (t.querySelector('.tile-desc').textContent !== desc) out.copy.push('desc ' + t.dataset.key)
        }
        if (document.querySelector('.hero-logo span').textContent !== c.brand) out.copy.push('brand')
        const cur = document.querySelector('.hero-locale [aria-current]')
        if (!cur || cur.dataset.lang !== to) out.copy.push('locale button')
      } else {
        const cur = document.querySelector('[hreflang][aria-current]')
        if (!cur || cur.getAttribute('hreflang') !== to) out.copy.push('locale link')
        out.text = document.querySelector('main')?.innerText
      }
      return out
    },
    sample,
    to
  )
}

/* 동작 줄이기: 아무것도 움직이지 않고 바로 바뀌어야 한다.
   시안은 전환 없이 바꾸므로 누른 다음 프레임에 이미 바뀌어 있어야 한다.
   앱은 React가 전환을 열되 모든 전환 애니메이션이 0ms여야 한다(globals.css) */
async function reducedCheck(browser, sample, sizeName, [from, to]) {
  const size = { ...SIZES[sizeName], deviceScaleFactor: 1 }
  const { url, button } = target(sample, from, to)
  const { page, errors } = await openPage(browser, sample, url, size, { reduced: true })
  await press(page, button, size)
  if (isApp(sample)) await waitDone(page)
  const r = await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() =>
          resolve({
            lang: document.documentElement.lang,
            anims: document.getAnimations().filter((a) => a.playState === 'running').length,
            vt: !!document.activeViewTransition,
            maxEnd: window.__lt.maxEnd ?? 0,
          })
        )
      )
  )
  const file = path.join(SHOTS, `${sample}-${sizeName}-${from}-${to}-reduced.png`)
  await page.screenshot({ path: file })
  await page.close()
  return { ...r, ok: r.lang === to && !r.anims && !r.vt && r.maxEnd === 0, file, errors }
}

/* ── 캡처를 한 장으로 묶는다 ── */
async function sheet(browser, tag, files, size) {
  const page = await browser.newPage()
  const cols = 4
  const w = size.width > 800 ? 420 : 200
  await page.setViewport({ width: cols * (w + 12) + 12, height: 400, deviceScaleFactor: 1 })
  const cells = files
    .map(({ t, file }) => {
      const src = 'data:image/png;base64,' + readFileSync(file).toString('base64')
      return `<figure><img src="${src}" width="${w}"><figcaption>${t === 'end' ? 'end' : t + 'ms'}</figcaption></figure>`
    })
    .join('')
  await page.setContent(
    `<style>body{margin:0;padding:12px;background:#000;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:12px;font:12px monospace;color:#aaa}figure{margin:0}img{display:block;border:1px solid #333}figcaption{padding-top:4px}</style>${cells}`,
    { waitUntil: 'load' }
  )
  const file = path.join(SHOTS, `sheet-${tag}.png`)
  await page.screenshot({ path: file, fullPage: true })
  await page.close()
  return file
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none', '--window-size=1440,900'],
  })
  const results = []
  const problems = []
  for (const sample of SAMPLES) {
    for (const sizeName of Object.keys(SIZES)) {
      for (const dir of DIRS) {
        const tag = `${sample}-${sizeName}-${dir.join('-')}`
        const row = { sample, size: sizeName, dir: dir.join('→') }
        if (!SKIP.includes('measure')) row.runs = await measure(browser, sample, sizeName, dir)
        if (!SKIP.includes('capture')) {
          const cap = await capture(browser, sample, sizeName, dir)
          row.capture = cap
          if (cap.files.length > 1) row.sheet = await sheet(browser, tag, cap.files, SIZES[sizeName])
          const s = cap.state
          if (s.lang !== dir[1]) problems.push(`[${tag}] 끝난 상태 lang=${s.lang}`)
          for (const c of s.copy) problems.push(`[${tag}] 문구/상태: ${c}`)
          if (s.leftover) problems.push(`[${tag}] view-transition-name이 ${s.leftover}개 남음`)
          if (s.running > cap.baseline.running)
            problems.push(`[${tag}] 끝난 뒤에도 애니메이션 ${s.running}개가 돎(새로 연 화면 ${cap.baseline.running}개)`)
          if (s.hscroll) problems.push(`[${tag}] 가로 스크롤`)
          const extra = s.hoverflow.filter((x) => !cap.baseline.hoverflow.includes(x))
          if (extra.length) problems.push(`[${tag}] 가로 넘침(전환 뒤에만): ${extra.join(', ')}`)
          if (s.text !== cap.baseline.text) problems.push(`[${tag}] 본문 글자가 새로 연 화면과 다름`)
          for (const e of cap.errors) problems.push(`[${tag}] JS: ${e}`)
        }
        if (!SKIP.includes('reduced')) {
          const rd = await reducedCheck(browser, sample, sizeName, dir)
          row.reduced = rd
          if (!rd.ok) problems.push(`[${tag}] 동작 줄이기: ${JSON.stringify(rd)}`)
          for (const e of rd.errors) problems.push(`[${tag}] JS(동작 줄이기): ${e}`)
        }
        for (const r of row.runs || []) {
          if (r.error) problems.push(`[${tag}] 측정: ${r.error}`)
          for (const e of r.errors || []) problems.push(`[${tag}] JS(측정): ${e}`)
        }
        results.push(row)
        console.log('done', tag)
      }
    }
  }
  await browser.close()
  writeFileSync(path.join(SHOTS, `results${filter ? '-' + filter : ''}.json`), JSON.stringify(results, null, 1))

  /* 표 */
  console.log('\n| 대상 | 크기 | 방향 | >20ms 프레임 | 최대 간격 | 메인 >20ms | Paint 준비/이후 (Paint 든 프레임/메인 프레임) | Layout 이후 | 시작 지연 | 비합성/전체 |')
  console.log('|---|---|---|---|---|---|---|---|---|---|')
  for (const row of results) {
    const rs = (row.runs || []).filter((r) => !r.error)
    if (!rs.length) continue
    const m = (k, d) => round(median(rs.map((r) => r[k])), d)
    console.log(
      `| ${row.sample} | ${row.size} | ${row.dir} | ${m('longFrames')}/${m('frames')} | ${m('maxGap', 1)}ms (최악 ${round(Math.max(...rs.map((r) => r.maxGap)), 1)}) | ${m('mainLong')} | ${m('paintSetup')}/${m('paintAnim')} (${m('paintFrames')}/${m('mainFrames')}) | ${m('layoutAnim')} | ${m('latency', 1)}ms | ${m('failedCount')}/${m('animations')} |`
    )
  }
  console.log('\n비합성 애니메이션(모든 실행 합):')
  for (const row of results) {
    const list = groupFailed((row.runs || []).flatMap((r) => r.failed || []))
    if (list.length) console.log(`- ${row.sample} ${row.size} ${row.dir}\n  ${list.join('\n  ')}`)
  }
  if (problems.length) {
    console.log('\nPROBLEMS (' + problems.length + ')')
    for (const p of problems) console.log(p)
    process.exitCode = 1
  } else console.log('\nALL CLEAR')
}
main().catch((e) => {
  console.error(e)
  process.exit(2)
})
