/* 시안 자동 검사. 헤드리스 크롬으로 시안을 여러 크기에서 열어
   입력·결과 상태를 스크린샷으로 찍고 다음을 검사한다.
   - 결과 화면 페이지 스크롤, 가로 넘침
   - 클립 컨테이너 안에서 잘림, 글자 겹침
   - JS 오류
   - 모바일 입력 중(키보드 올라온 높이) 정확도 표시가 화면 안에 있는지
   - 한국어 단어가 중간에서 줄바꿈되는지
   - 입력→결과 흐름과 결과 인터랙션, 동작 줄이기
   사용: node verify.mjs [샘플 필터] [--sizes=390x844,...] [--shots=DIR]
   puppeteer-core는 저장소 밖(/tmp/mock-tools)에 설치한다(run.sh 참고). */
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const require = createRequire('/tmp/mock-tools/package.json')
const puppeteer = require('puppeteer-core')

const BASE = process.env.MOCK_BASE || 'http://127.0.0.1:8765/mockups/'
const args = process.argv.slice(2)
const filter = args.find((a) => !a.startsWith('--')) || ''
const sizesArg = (args.find((a) => a.startsWith('--sizes=')) || '').slice(8)
const SHOTS = (args.find((a) => a.startsWith('--shots=')) || '').slice(8) || '/tmp/mock-shots'
mkdirSync(SHOTS, { recursive: true })

const SAMPLES = ['fortune-sentence'].filter((s) =>
  s.includes(filter)
)
const SIZES = (sizesArg || '1440x900,1280x720,820x1180,390x844,375x667')
  .split(',')
  .map((s) => s.split('x').map(Number))
const KEYBOARD = 320 // 모바일 키보드가 차지하는 높이(대략)

/* ── 페이지 안에서 도는 검사 ── */
const checks = `(() => {
  const out = { scroll: null, hoverflow: [], clipped: [], overlap: [], breaks: [] }
  const de = document.documentElement
  out.scroll = { sh: de.scrollHeight, ih: innerHeight, sw: de.scrollWidth, iw: innerWidth }
  const visible = (el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  const all = [...document.body.querySelectorAll('*')].filter((el) => !el.closest('.sr-only') && visible(el))
  const describe = (el) => {
    let s = el.tagName.toLowerCase()
    if (el.id) s += '#' + el.id
    else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.')
    const t = (el.textContent || '').trim().slice(0, 24)
    return t ? s + ' "' + t + '"' : s
  }
  /* 가로 넘침 */
  for (const el of all) {
    const r = el.getBoundingClientRect()
    if (el.parentElement.closest('[data-clips]')) continue
    if (r.right > innerWidth + 1 || r.left < -1) out.hoverflow.push({ el: describe(el), left: Math.round(r.left), right: Math.round(r.right) })
  }
  /* 클립 컨테이너 밖으로 나간 요소 + 자기 상자 안에서 넘치는 글자 */
  const clipAncestors = (el) => {
    const list = []
    for (let p = el.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p)
      if (/hidden|clip/.test(cs.overflow) || /hidden|clip/.test(cs.overflowX) || /hidden|clip/.test(cs.overflowY)) list.push(p)
    }
    return list
  }
  for (const el of all) {
    const r = el.getBoundingClientRect()
    for (const p of clipAncestors(el)) {
      if ('clips' in p.dataset) break
      const pr = p.getBoundingClientRect()
      const cs = getComputedStyle(p)
      const cx = /hidden|clip/.test(cs.overflowX) || /hidden|clip/.test(cs.overflow)
      const cy = /hidden|clip/.test(cs.overflowY) || /hidden|clip/.test(cs.overflow)
      const out1 = (cx && (r.left < pr.left - 1 || r.right > pr.right + 1)) || (cy && (r.top < pr.top - 1 || r.bottom > pr.bottom + 1))
      if (out1 && !('mayClip' in el.dataset) && !('clips' in p.dataset)) {
        out.clipped.push({ el: describe(el), by: describe(p), r: [r.left, r.top, r.right, r.bottom].map(Math.round), p: [pr.left, pr.top, pr.right, pr.bottom].map(Math.round) })
        break
      }
    }
    const cs = getComputedStyle(el)
    if (cs.overflow !== 'visible' && cs.textOverflow !== 'ellipsis' && !('scrolls' in el.dataset)) {
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
        out.clipped.push({ el: describe(el), self: true, sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight })
      }
    }
  }
  /* 글자 겹침과 한국어 단어 중간 줄바꿈 */
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const texts = []
  while (walker.nextNode()) {
    const n = walker.currentNode
    if (!n.textContent.trim()) continue
    const el = n.parentElement
    if (!el || el.closest('.sr-only') || el.closest('script,style') || !visible(el)) continue
    const range = document.createRange()
    range.selectNodeContents(n)
    /* 클립 컨테이너 밖으로 나간 글자 상자는 보이지 않으므로 뺀다 */
    let clip = { left: -1e9, top: -1e9, right: 1e9, bottom: 1e9 }
    for (const p of clipAncestors(el)) {
      const pr = p.getBoundingClientRect()
      clip = { left: Math.max(clip.left, pr.left), top: Math.max(clip.top, pr.top), right: Math.min(clip.right, pr.right), bottom: Math.min(clip.bottom, pr.bottom) }
    }
    const rects = [...range.getClientRects()]
      .map((r) => ({ left: Math.max(r.left, clip.left), top: Math.max(r.top, clip.top), right: Math.min(r.right, clip.right), bottom: Math.min(r.bottom, clip.bottom) }))
      .map((r) => ({ ...r, width: r.right - r.left, height: r.bottom - r.top }))
      .filter((r) => r.width > 1 && r.height > 1)
    if (!rects.length) continue
    texts.push({ n, el, rects })
    /* 줄바꿈 지점 찾기: 글자마다 top 비교 */
    if (rects.length > 1) {
      const s = n.textContent
      let prevTop = null
      for (let i = 0; i < s.length; i++) {
        range.setStart(n, i); range.setEnd(n, i + 1)
        const rr = range.getClientRects()[0]
        if (!rr) continue
        if (prevTop !== null && Math.abs(rr.top - prevTop) > 2) {
          const a = s[i - 1], b = s[i]
          const hangul = (c) => /[\\uAC00-\\uD7A3]/.test(c)
          if (hangul(a) && hangul(b)) out.breaks.push({ el: describe(el), at: s.slice(Math.max(0, i - 6), i) + '|' + s.slice(i, i + 6) })
        }
        prevTop = rr.top
      }
    }
  }
  const related = (a, b) => a === b || a.contains(b) || b.contains(a)
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const A = texts[i], B = texts[j]
    if (related(A.el, B.el)) continue
    for (const ra of A.rects) for (const rb of B.rects) {
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
      if (w > 2 && h > 2) {
        out.overlap.push({ a: describe(A.el), b: describe(B.el), w: Math.round(w), h: Math.round(h) })
        j = texts.length; break
      }
    }
  }
  return out
})()`

/* ── 시안별 시나리오: 입력→결과 흐름, 결과 인터랙션 ── */
const SCENARIOS = {}

SCENARIOS['fortune-sentence'] = {
  accuracy: '#meter',
  firstInput: '#f-year',
  kept: (page) => page.$eval('#f-year', (e) => e.value === '1994'),
  async fill(page) {
    await page.type('#f-year', '19940512')
    await page.type('#f-time', '0700')
    await page.keyboard.press('Enter')
  },
  async interact(page) {
    const before = await page.$eval('#noteTitle', (e) => e.textContent)
    await page.hover('.kw[data-n="3"]')
    const mid = await page.$eval('#noteTitle', (e) => e.textContent)
    await page.hover('.dom[data-k="rel"]')
    const after = await page.$eval('#noteTitle', (e) => e.textContent)
    return before !== mid && mid !== after ? null : '각주·분야 호버가 반응하지 않음'
  },
}

const problems = []
const note = (sample, size, state, kind, detail) => {
  problems.push({ sample, size, state, kind, detail })
}

async function openPage(browser, url, [w, h], reduced) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await page.bringToFront()
  return { page, errors }
}

async function runChecks(page, sample, size, state, { resultStrict }) {
  const r = await page.evaluate(checks)
  const tag = size.join('x')
  if (resultStrict && (r.scroll.sh > r.scroll.ih + 1)) note(sample, tag, state, 'scroll', `scrollHeight ${r.scroll.sh} > ${r.scroll.ih}`)
  if (r.scroll.sw > r.scroll.iw + 1) note(sample, tag, state, 'hscroll', `scrollWidth ${r.scroll.sw} > ${r.scroll.iw}`)
  for (const x of r.hoverflow) note(sample, tag, state, 'hoverflow', JSON.stringify(x))
  for (const x of r.clipped) note(sample, tag, state, 'clipped', JSON.stringify(x))
  for (const x of r.overlap) note(sample, tag, state, 'overlap', JSON.stringify(x))
  for (const x of r.breaks) note(sample, tag, state, 'korean-break', JSON.stringify(x))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none', '--window-size=1440,900'],
  })
  for (const sample of SAMPLES) {
    const sc = SCENARIOS[sample]
    for (const size of SIZES) {
      const tag = size.join('x')
      /* 입력 상태 */
      {
        const { page, errors } = await openPage(browser, BASE + sample + '.html', size)
        await sleep(400)
        await page.screenshot({ path: path.join(SHOTS, `${sample}-${tag}-input.png`) })
        await runChecks(page, sample, size, 'input', { resultStrict: false })
        /* 모바일: 키보드가 올라온 높이에서 입력 중 정확도 표시가 보이는가 */
        if (size[0] < 500) {
          await page.setViewport({ width: size[0], height: size[1] - KEYBOARD, deviceScaleFactor: 1 })
          await page.focus(sc.firstInput)
          await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), sc.firstInput)
          await sleep(200)
          const vis = await page.evaluate((sel) => {
            const r = document.querySelector(sel).getBoundingClientRect()
            return { top: r.top, bottom: r.bottom, ih: innerHeight }
          }, sc.accuracy)
          if (vis.top < 0 || vis.bottom > vis.ih) note(sample, tag, 'input+keyboard', 'accuracy-offscreen', JSON.stringify(vis))
          await page.screenshot({ path: path.join(SHOTS, `${sample}-${tag}-input-keyboard.png`) })
        }
        for (const e of errors) note(sample, tag, 'input', 'js', e)
        await page.close()
      }
      /* 결과 상태(?demo) */
      {
        const { page, errors } = await openPage(browser, BASE + sample + '.html?demo', size)
        await sleep(900)
        await page.screenshot({ path: path.join(SHOTS, `${sample}-${tag}-result.png`) })
        await runChecks(page, sample, size, 'result', { resultStrict: true })
        const state = await page.evaluate(() => document.documentElement.dataset.state)
        if (state !== 'result') note(sample, tag, 'result', 'demo', '?demo인데 결과 상태가 아님')
        const err = await sc.interact(page).catch((e) => '예외: ' + e.message)
        if (err) note(sample, tag, 'result', 'interact', err)
        await sleep(300)
        await page.screenshot({ path: path.join(SHOTS, `${sample}-${tag}-result-touched.png`) })
        await runChecks(page, sample, size, 'result-touched', { resultStrict: true })
        for (const e of errors) note(sample, tag, 'result', 'js', e)
        await page.close()
      }
    }
    /* 실제 입력→결과 흐름(데스크톱·모바일) + 결과에서 입력으로 돌아가면 값 유지 */
    for (const size of [[1280, 720], [390, 844]]) {
      const tag = size.join('x')
      const { page, errors } = await openPage(browser, BASE + sample + '.html', size)
      await sc.fill(page)
      await sleep(900)
      const state = await page.evaluate(() => document.documentElement.dataset.state)
      if (state !== 'result') note(sample, tag, 'flow', 'flow', '입력 후 결과 상태로 가지 않음')
      await page.screenshot({ path: path.join(SHOTS, `${sample}-${tag}-flow-result.png`) })
      await runChecks(page, sample, size, 'flow-result', { resultStrict: true })
      await page.click('#back')
      await sleep(700)
      const back = await page.evaluate(() => document.documentElement.dataset.state)
      if (back !== 'input') note(sample, tag, 'flow', 'flow', '다시 입력으로 돌아가지 않음')
      const kept = await sc.kept(page)
      if (!kept) note(sample, tag, 'flow', 'kept', '값이 유지되지 않음')
      await page.screenshot({ path: path.join(SHOTS, `${sample}-${tag}-flow-back.png`) })
      for (const e of errors) note(sample, tag, 'flow', 'js', e)
      await page.close()
    }
    /* 동작 줄이기 */
    {
      const size = [1280, 720]
      const { page, errors } = await openPage(browser, BASE + sample + '.html', size, true)
      await sc.fill(page)
      await sleep(300)
      const state = await page.evaluate(() => document.documentElement.dataset.state)
      if (state !== 'result') note(sample, '1280x720', 'reduced', 'flow', '동작 줄이기에서 결과로 가지 않음')
      const err = await sc.interact(page).catch((e) => '예외: ' + e.message)
      if (err) note(sample, '1280x720', 'reduced', 'interact', err)
      const running = await page.evaluate(() =>
        document.getAnimations().filter((a) => a.playState === 'running').length
      )
      if (running) note(sample, '1280x720', 'reduced', 'reduced-motion', `${running}개 애니메이션이 돌고 있음`)
      await page.screenshot({ path: path.join(SHOTS, `${sample}-reduced-result.png`) })
      for (const e of errors) note(sample, '1280x720', 'reduced', 'js', e)
      await page.close()
    }
    console.log('done', sample)
  }
  await browser.close()
  if (problems.length) {
    console.log('\nPROBLEMS (' + problems.length + ')')
    for (const p of problems) console.log(`[${p.sample} ${p.size} ${p.state}] ${p.kind}: ${p.detail}`)
    process.exitCode = 1
  } else console.log('\nALL CLEAR')
}
main().catch((e) => {
  console.error(e)
  process.exit(2)
})
