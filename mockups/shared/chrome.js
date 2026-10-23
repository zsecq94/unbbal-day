/* ───────────────────────────────────────────────────────────────
   운빨데이 · 시안 공용 크롬과 도우미
   - 상단바(홈·로고·언어)와 스테이지 헤더를 그려 넣는다.
   - 입력↔결과 상태 전환, ?demo, 대기 효과 일시정지, 숫자 트윈,
     샘플 운세 데이터(생년월일 기반 결정적 난수)를 제공한다.
   ─────────────────────────────────────────────────────────────── */
;(function () {
  const LEAF = 'M19 19H10A9 9 0 0 1 1 10A9 9 0 0 1 10 1A9 9 0 0 1 19 10Z'
  const FORTUNE_SYMBOL =
    '<circle cx="24" cy="24" r="17"/><path d="M24 13 L26.6 21.4 L35 24 L26.6 26.6 L24 35 L21.4 26.6 L13 24 L21.4 21.4 Z"/>'

  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const html = document.documentElement

  /* ── 크롬 ── */
  function chrome() {
    const stage = document.querySelector('.stage')
    const frame = document.querySelector('.frame')
    if (!stage || !frame) return
    const top = document.createElement('header')
    top.className = 'topbar'
    top.innerHTML = `
      <a class="topbar-back" href="./index.html" aria-label="홈으로 돌아가기">
        <span class="arrow" aria-hidden="true">←</span><span class="label">홈</span>
      </a>
      <span class="logo">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="${LEAF}" fill="currentColor"/>
          <path d="${LEAF}" fill="var(--brand)" transform="rotate(90 20 20)"/>
          <path d="${LEAF}" fill="currentColor" transform="rotate(270 20 20)"/>
          <path d="${LEAF}" fill="currentColor" transform="rotate(180 20 20)"/>
        </svg>
        <span class="name">운빨데이</span>
      </span>
      <nav class="locale" aria-label="언어 선택">
        <button type="button" aria-current="true" lang="ko">ko</button>
        <button type="button" lang="en">en</button>
      </nav>`
    frame.insertBefore(top, stage)
    /* 스테이지 헤더. 운세가 아닌 게임은 .stage의 data-index·data-title·data-kind와
       window.STAGE_SYMBOL(48×48 심볼 마크업)로 바꾼다 */
    const d = stage.dataset
    const head = document.createElement('header')
    head.className = 'stage-head'
    head.innerHTML = `
      <span class="index" aria-hidden="true">${d.index || '01'}</span>
      <span class="title">
        <svg class="symbol" viewBox="0 0 48 48" aria-hidden="true" style="stroke-width:2.4">${window.STAGE_SYMBOL || FORTUNE_SYMBOL}</svg>
        <h1 id="game-title">${d.title || '오늘의 운세'}</h1>
      </span>
      <span class="kind">${d.kind || '혼자'}</span>`
    stage.insertBefore(head, stage.firstChild)
  }

  /* ── 상태 전환: 이전 뷰 퇴장 → 새 뷰 등장. 그동안 대기 효과는 멈춘다 ── */
  let transitTimer = 0
  function go(state, { instant = false } = {}) {
    const from = document.querySelector('.view-' + html.dataset.state)
    const to = document.querySelector('.view-' + state)
    if (!to || html.dataset.state === state) return
    const swap = () => {
      html.dataset.state = state
      if (from) from.classList.remove('leaving')
      to.classList.add('entering')
      window.scrollTo(0, 0)
      document.dispatchEvent(new CustomEvent('mock:state', { detail: state }))
    }
    if (instant || reduced.matches) {
      swap()
      to.classList.remove('entering')
      document.dispatchEvent(new CustomEvent('mock:settled', { detail: state }))
      return
    }
    html.dataset.transit = ''
    clearTimeout(transitTimer)
    if (from) from.classList.add('leaving')
    setTimeout(swap, 120)
    transitTimer = setTimeout(() => {
      to.classList.remove('entering')
      delete html.dataset.transit
      document.dispatchEvent(new CustomEvent('mock:settled', { detail: state }))
    }, 120 + 420)
  }

  /* ── 대기 효과: 전환 중·화면 밖·동작 줄이기에서는 돌지 않는다 ── */
  const idlers = []
  function idle(fn, every) {
    idlers.push({ fn, every, last: 0 })
  }
  function paused() {
    return (
      reduced.matches || html.hasAttribute('data-transit') || document.hidden
    )
  }
  function loop(t) {
    if (!paused()) {
      for (const it of idlers) {
        if (t - it.last >= it.every) {
          it.last = t
          it.fn(t)
        }
      }
    }
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  /* ── 숫자 트윈: 모노 숫자가 굴러가며 바뀐다 ── */
  const tweens = new WeakMap()
  function tween(el, to, { ms = 420, fmt = (v) => Math.round(v) } = {}) {
    const from = tweens.has(el) ? tweens.get(el).value : Number(el.dataset.v || 0)
    cancelAnimationFrame((tweens.get(el) || {}).raf)
    if (reduced.matches || ms === 0) {
      el.textContent = fmt(to)
      el.dataset.v = to
      tweens.set(el, { value: to })
      return
    }
    const t0 = performance.now()
    const state = { value: from, raf: 0 }
    tweens.set(el, state)
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      state.value = from + (to - from) * e
      el.textContent = fmt(state.value)
      if (p < 1) state.raf = requestAnimationFrame(step)
      else el.dataset.v = to
    }
    state.raf = requestAnimationFrame(step)
  }

  /* ── 샘플 운세 데이터 ── */
  const DOMAINS = [
    { key: 'all', name: '총운' },
    { key: 'money', name: '재물' },
    { key: 'love', name: '애정' },
    { key: 'health', name: '건강' },
    { key: 'work', name: '일' },
  ]
  const ANIMALS = ['원숭이', '닭', '개', '돼지', '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양']
  const SIGNS = [
    [120, '염소자리'], [219, '물병자리'], [321, '물고기자리'], [420, '양자리'],
    [521, '황소자리'], [621, '쌍둥이자리'], [723, '게자리'], [823, '사자자리'],
    [923, '처녀자리'], [1023, '천칭자리'], [1122, '전갈자리'], [1222, '사수자리'],
    [1231, '염소자리'],
  ]
  const HOURS = [
    ['자', 23, '23–01'], ['축', 1, '01–03'], ['인', 3, '03–05'], ['묘', 5, '05–07'],
    ['진', 7, '07–09'], ['사', 9, '09–11'], ['오', 11, '11–13'], ['미', 13, '13–15'],
    ['신', 15, '15–17'], ['유', 17, '17–19'], ['술', 19, '19–21'], ['해', 21, '21–23'],
  ]
  const INTERESTS = ['일·학업', '재물', '연애', '건강', '인간관계']
  const LINES = {
    all: [
      '작게 시작한 일이 생각보다 멀리 갑니다.',
      '서두르지 않아도 제자리에 도착하는 날입니다.',
      '오후로 갈수록 흐름이 또렷해집니다.',
    ],
    money: [
      '쓰는 돈보다 지키는 돈이 눈에 띕니다.',
      '작은 지출 하나가 기분을 좌우합니다.',
      '미뤄 둔 정산을 끝내기 좋은 날입니다.',
    ],
    love: [
      '먼저 건넨 한마디가 오래 남습니다.',
      '가까운 사람의 말을 끝까지 들어 보세요.',
      '기대를 내려놓을수록 가벼워집니다.',
    ],
    health: [
      '물 한 잔, 짧은 산책이면 충분합니다.',
      '늦은 밤보다 이른 아침이 편안합니다.',
      '어깨의 힘을 빼는 순간이 필요합니다.',
    ],
    work: [
      '하나를 끝내고 다음을 시작하세요.',
      '말보다 메모가 오래 남는 날입니다.',
      '점심 이후 집중이 돌아옵니다.',
    ],
  }
  const HEADLINES = [
    '오늘은 서두르지 않는 쪽이 이깁니다.',
    '작은 선택이 하루의 방향을 정합니다.',
    '오후에 열리는 문을 놓치지 마세요.',
    '가볍게 시작한 일이 멀리 갑니다.',
  ]
  const COLORS = ['남색', '회색', '흰색', '초록', '노랑', '검정']
  const DIRS = ['동', '서', '남', '북', '북동', '남서']

  function rng(seed) {
    let s = seed >>> 0 || 1
    return () => {
      s ^= s << 13
      s ^= s >>> 17
      s ^= s << 5
      return ((s >>> 0) % 10000) / 10000
    }
  }

  function zodiac(y) {
    return y ? ANIMALS[((y % 12) + 12) % 12] + '띠' : ''
  }
  function sign(m, d) {
    if (!m || !d) return ''
    const md = m * 100 + d
    for (const [limit, name] of SIGNS) if (md < limit) return name
    return SIGNS[SIGNS.length - 1][1]
  }
  function validDate(y, m, d) {
    if (!y || !m || !d) return false
    if (y < 1900 || y > 2026 || m < 1 || m > 12 || d < 1) return false
    return d <= new Date(y, m, 0).getDate()
  }

  /* 정확도: 생년월일 40, 시간 20, 양·음 10, 성별 10, 이름 10, 관심 10 */
  const WEIGHTS = { date: 40, hour: 20, cal: 10, sex: 10, name: 10, interest: 10 }
  function accuracy(f) {
    let v = 0
    for (const k in WEIGHTS) if (f[k]) v += WEIGHTS[k]
    return v
  }

  function fortune(f) {
    const y = f.y || 1994
    const m = f.m || 5
    const d = f.d || 12
    const seed = y * 10000 + m * 100 + d + (f.hour ? 7 * f.hour : 0)
    const r = rng(seed)
    const scores = {}
    DOMAINS.forEach((dm) => {
      scores[dm.key] = 48 + Math.round(r() * 48) + (f.interest && f.interest.length ? 2 : 0)
    })
    scores.all = Math.round(
      DOMAINS.slice(1).reduce((a, dm) => a + scores[dm.key], 0) / 4
    )
    const lines = {}
    DOMAINS.forEach((dm) => {
      lines[dm.key] = LINES[dm.key][Math.floor(r() * LINES[dm.key].length)]
    })
    const hours = []
    let v = scores.all
    for (let h = 0; h < 24; h++) {
      v = Math.max(30, Math.min(98, v + Math.round((r() - 0.5) * 22)))
      hours.push(v)
    }
    const best = hours.indexOf(Math.max(...hours))
    const worst = hours.indexOf(Math.min(...hours))
    return {
      scores,
      lines,
      hours,
      best,
      worst,
      headline: HEADLINES[Math.floor(r() * HEADLINES.length)],
      lucky: {
        number: 1 + Math.floor(r() * 45),
        color: COLORS[Math.floor(r() * COLORS.length)],
        dir: DIRS[Math.floor(r() * DIRS.length)],
      },
      zodiac: zodiac(y),
      sign: sign(m, d),
    }
  }

  const pad2 = (n) => String(n).padStart(2, '0')
  const today = () => {
    const d = new Date()
    const w = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${w[d.getDay()]}`
  }

  const demo = new URLSearchParams(location.search).has('demo')
  const DEMO = {
    y: 1994, m: 5, d: 12, hour: 7, cal: 'solar', sex: 'm', name: '지우',
    interest: ['재물', '연애'],
  }

  window.Mock = {
    go,
    idle,
    paused,
    tween,
    reduced,
    demo,
    DEMO,
    DOMAINS,
    HOURS,
    INTERESTS,
    accuracy,
    fortune,
    zodiac,
    sign,
    validDate,
    pad2,
    today,
    rng,
  }

  html.dataset.state = html.dataset.state || 'input'
  chrome()
})()
