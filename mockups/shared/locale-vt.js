/* ───────────────────────────────────────────────────────────────
   운빨데이 · 언어 전환 시안 공용 도우미
   앱에서 언어 링크를 누르면 Next가 startTransition 안에서 새 로케일 페이지를
   그리고, React가 그 커밋을 document.startViewTransition으로 감싼다.
   이 파일은 그 과정을 바닐라로 그대로 따라 해서, 시안에서 잰 비용이 앱과
   같은 경로를 타게 한다.
   - 이름: React처럼 이전 DOM과 새 DOM 양쪽에 view-transition-name/class를
     붙이고, 끝나면 지운다.
   - 루트 취소: 루트가 전환에 참여하지 않으면 React는 루트 이름을 none으로
     바꾸고 ::view-transition-group(root)를 0ms 애니메이션으로 숨긴다.
   - 크기 키프레임: React는 ready에서 그룹 키프레임의 바뀌지 않는
     width/height를 지운다. 바뀌는 것은 시안이 stripSize로 지운다.
   - 동작 줄이기와 ?instant(측정 기준선): 전환 없이 바로 바꾼다.
   - 측정: performance.mark(lt:start/ready/end)와 window.__lt에 시각을 남긴다.
   - 캡처: window.__lt.seek(ms)로 전환 애니메이션을 멈추고 그 시점으로 옮긴다.
   ─────────────────────────────────────────────────────────────── */
;(function () {
  const html = document.documentElement
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const params = new URLSearchParams(location.search)
  /* 측정 기준선: 전환 없이 바로 바꾼다 */
  const instant = params.has('instant')

  /* 운: ?seed=로 고정할 수 있는 난수. 없으면 매번 다르다 */
  let seed = Number(params.get('seed')) || (Math.random() * 2 ** 31) | 0
  function luck() {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    return ((seed >>> 0) % 100000) / 100000
  }

  /* ── 이름 붙이기 ── */
  const named = new Set()
  function name(el, vtName, cls) {
    if (!el) return
    el.style.viewTransitionName = vtName
    if (cls) el.style.viewTransitionClass = cls
    named.add(el)
  }
  function clearNames() {
    for (const el of named) {
      el.style.viewTransitionName = ''
      el.style.viewTransitionClass = ''
    }
    named.clear()
  }

  /* ── 측정 기록 ── */
  const lt = (window.__lt = { runs: 0, state: 'idle', seek: null })
  function begin(event) {
    Object.assign(lt, {
      state: 'running',
      click: event ? event.timeStamp : performance.now(),
      start: performance.now(),
      ready: null,
      firstFrame: null,
      end: null,
    })
    performance.mark('lt:start')
  }
  function markReady() {
    lt.ready = performance.now()
    performance.mark('lt:ready')
    requestAnimationFrame((t) => {
      lt.firstFrame = t
    })
  }
  function finish() {
    lt.end = performance.now()
    performance.mark('lt:end')
    lt.state = 'done'
    lt.runs++
    document.dispatchEvent(new CustomEvent('lt:done'))
  }

  /* ── 전환 애니메이션 다루기 ── */
  function vtAnimations() {
    return html
      .getAnimations({ subtree: true })
      .filter(
        (a) =>
          a.effect &&
          a.effect.pseudoElement &&
          a.effect.pseudoElement.startsWith('::view-transition')
      )
  }
  const nameOf = (pseudo) => pseudo.slice(pseudo.indexOf('(') + 1, -1)

  /* React의 ready 처리 그대로: 바뀌지 않는 width/height를 키프레임에서 지운다 */
  function stripUnchanged() {
    for (const a of vtAnimations()) {
      const effect = a.effect
      const kfs = effect.getKeyframes()
      let w
      let h
      let same = true
      for (const k of kfs) {
        if (w === undefined) w = k.width
        else if (w !== k.width) {
          same = false
          break
        }
        if (h === undefined) h = k.height
        else if (h !== k.height) {
          same = false
          break
        }
        delete k.width
        delete k.height
        if (k.transform === 'none') delete k.transform
      }
      if (same && w !== undefined && h !== undefined) {
        effect.setKeyframes(kfs)
        const cs = getComputedStyle(effect.target, effect.pseudoElement)
        if (cs.width !== w || cs.height !== h) {
          Object.assign(kfs[0], { width: w, height: h })
          Object.assign(kfs[kfs.length - 1], { width: w, height: h })
          effect.setKeyframes(kfs)
        }
      }
    }
  }

  /* 크기가 바뀌는 그룹에서 width/height를 지운다. 그룹은 처음부터 새 크기이고
     위치(transform)만 옮겨 간다(앱은 LocaleSwitch의 toss가 같은 일을 한다) */
  function stripSize(match) {
    for (const a of vtAnimations()) {
      const p = a.effect.pseudoElement
      if (!p.startsWith('::view-transition-group(') || !match(nameOf(p))) continue
      const kfs = a.effect.getKeyframes()
      for (const k of kfs) {
        delete k.width
        delete k.height
      }
      a.effect.setKeyframes(kfs)
    }
  }
  /* React가 루트를 전환에서 빼는 방법 그대로 */
  function cancelRoot() {
    if (html.style.viewTransitionName !== '') return
    html.style.viewTransitionName = 'none'
    html.animate(
      { opacity: [0, 0], pointerEvents: ['none', 'none'] },
      {
        duration: 0,
        fill: 'forwards',
        pseudoElement: '::view-transition-group(root)',
      }
    )
    html.animate(
      { width: [0, 0], height: [0, 0] },
      { duration: 0, fill: 'forwards', pseudoElement: '::view-transition' }
    )
  }

  function seekVT(ms) {
    for (const a of vtAnimations()) {
      a.pause()
      a.currentTime = ms
    }
  }

  /* 한 번의 언어 전환. before: 이전 DOM에 이름, update: DOM 교체 + 새 DOM에
     이름, ready: 애니메이션이 생긴 뒤 다듬기 */
  function run({ event, types, before, update, ready }) {
    begin(event)
    if (instant || reduced.matches || !document.startViewTransition) {
      update()
      clearNames()
      markReady()
      finish()
      return null
    }
    if (before) before()
    const cost = (lt.cost = {})
    const timed = (k, fn) => {
      const t = performance.now()
      fn()
      cost[k] = performance.now() - t
    }
    lt.vtCall = performance.now()
    const vt = document.startViewTransition({
      update: () => {
        lt.vtUpdate = performance.now()
        timed('update', update)
        cancelRoot()
      },
      types,
    })
    lt.seek = seekVT
    vt.ready.then(
      () => {
        lt.vtReady = performance.now()
        timed('react', stripUnchanged)
        if (ready) timed('concept', () => ready(vt))
        markReady()
      },
      () => {}
    )
    vt.finished.finally(() => {
      html.style.viewTransitionName = ''
      clearNames()
      finish()
    })
    return vt
  }

  window.LocaleVT = { luck, name, run, vtAnimations, stripSize }
})()
