/* ───────────────────────────────────────────────────────────────
   운빨데이 · 허브 시안 공용 렌더러
   앱 허브(components/game-hub.tsx, components/hero.tsx)의 마크업을 그대로
   그린다. 문구는 앱 사전(app/[lang]/dictionaries)에서 옮겨 왔다.
   배치는 shared/hub.css에 있다.
   ?lang=en 또는 상단 언어 버튼으로 영어를 본다.
   ─────────────────────────────────────────────────────────────── */
;(function () {
  const LEAF = 'M19 19H10A9 9 0 0 1 1 10A9 9 0 0 1 10 1A9 9 0 0 1 19 10Z'

  /* components/game-symbol.tsx와 같은 48×48 라인 심볼 */
  const SYMBOLS = {
    fortune:
      '<circle cx="24" cy="24" r="16"/><path d="M24 15.5 L26.2 21.8 L32.5 24 L26.2 26.2 L24 32.5 L21.8 26.2 L15.5 24 L21.8 21.8 Z"/>',
    lotto:
      '<circle cx="24" cy="15" r="6.5"/><circle cx="15" cy="31" r="6.5"/><circle cx="33" cy="31" r="6.5"/>',
    match:
      '<path d="M5 9h7v7h-7zM15.5 9h7v7h-7zM26 9h7v7h-7zM36.5 9h7v7h-7z"/><path d="M10.25 20.5h7v7h-7zM20.75 20.5h7v7h-7zM31.25 20.5h7v7h-7z"/><path class="f" d="M15.5 32h7v7h-7zM26 32h7v7h-7z"/>',
    pinball:
      '<circle cx="29" cy="13" r="5.5"/><path d="M7 31 L20 39"/><path d="M41 31 L28 39"/><path class="f" d="M22.5 23.5h2.5v2.5h-2.5z"/>',
    ladder:
      '<path d="M14 7 V41"/><path d="M34 7 V41"/><path d="M14 15 H34"/><path d="M14 25 H34"/><path d="M14 34 H34"/>',
    wheel:
      '<circle cx="24" cy="25" r="16"/><path d="M24 9 V41"/><path d="M8 25 H40"/><path class="f" d="M20 2 H28 L24 8 Z"/>',
    horse:
      '<path d="M14 40 V24 A10 10 0 0 1 34 24 V40"/><path d="M9 40 H19"/><path d="M29 40 H39"/>',
    racing:
      '<path d="M11 43 V6"/><rect x="11" y="8" width="27" height="20"/><path class="f" d="M11 8h9v10h-9zM29 8h9v10h-9zM20 18h9v10h-9z"/>',
  }

  /* lib/games.ts와 같은 순서·종류·호버 모션 */
  const GAMES = [
    { key: 'fortune', kind: 'solo', motion: 'rotate(-10deg) scale(1.04)' },
    { key: 'lotto', kind: 'solo', motion: 'rotate(120deg)' },
    { key: 'match', kind: 'solo', motion: 'translateY(4px) scale(1.06)' },
    { key: 'pinball', kind: 'together', motion: 'translateY(5px) rotate(-6deg)' },
    { key: 'ladder', kind: 'together', motion: 'translateY(-6px)' },
    { key: 'wheel', kind: 'together', motion: 'rotate(90deg)' },
    { key: 'horse', kind: 'together', motion: 'translateY(-5px)' },
    { key: 'racing', kind: 'together', motion: 'translate(6px, -4px)' },
  ]

  /* 위 줄 타일 크기: 운세는 크게, 로또·궁합은 위아래로 쌓는 반 칸. 나머지는 sm */
  const SIZES = { fortune: 'lg', lotto: 'half', match: 'half' }

  const COPY = {
    ko: {
      brand: '운빨데이',
      hero: {
        title: '어떤 재미에,<br><em>운이</em> 끌리나요?',
        sub: '나를 위한 <b>작은 운세</b>부터, 함께하는 <b>짜릿한 경주</b>까지.',
        counts: ['GAMES', '혼자', '함께'],
        today: 'TODAY',
      },
      kinds: { solo: '혼자', together: '함께' },
      tileHint: '시작',
      idle: '마음이 가는 게임을 골라보세요.',
      copyright: '© 2026 운빨데이',
      games: {
        fortune: ['오늘의 운세', '오늘 나에게 찾아올 운을 가볍게 확인해요.'],
        lotto: ['로또 번호 뽑기', '오늘의 운세에서 행운의 번호를 찾아요.'],
        match: ['이름 궁합', '두 이름의 획수로 알아보는 우리 사이 궁합.'],
        pinball: ['핀볼', '통통 튀는 구슬, 끝까지 모르는 낙하 경주.'],
        ladder: ['사다리 타기', '엇갈리는 길 끝에서 각자의 결과를 만나요.'],
        wheel: ['원판 돌리기', '빙글 도는 원판, 멈추는 순간 운명이 결정돼요.'],
        horse: ['경마', '앞서거니 뒤서거니, 마지막까지 짜릿한 말 경주.'],
        racing: ['레이싱', '결승선까지 방심 금지, 순위가 뒤집히는 자동차 경주.'],
      },
    },
    en: {
      brand: 'Unbbal Day',
      hero: {
        title: 'Feeling<br><em>lucky</em> today?',
        sub: 'From a <b>little fortune</b> for you to <b>thrilling races</b> with friends.',
        counts: ['GAMES', 'SOLO', 'TOGETHER'],
        today: 'TODAY',
      },
      kinds: { solo: 'Solo', together: 'Together' },
      tileHint: 'Play',
      idle: 'Pick a game that speaks to you.',
      copyright: '© 2026 Unbbal Day',
      games: {
        fortune: ["Today's Fortune", 'A quick look at the luck coming your way.'],
        lotto: ['Lucky Numbers', "Draw your lucky numbers from today's fortune."],
        match: ['Name Match', 'Two names, one score: how well do you match?'],
        pinball: ['Pinball', 'Bouncing marbles, a drop race anyone can win.'],
        ladder: ['Ladder Game', 'Crossing paths lead everyone to their fate.'],
        wheel: ['Spin the Wheel', 'Round and round, until fate stops it.'],
        horse: ['Horse Race', 'Neck and neck to the very last stride.'],
        racing: ['Racing', 'Stay sharp, the lead can flip before the finish.'],
      },
    },
  }

  const pad2 = (n) => String(n).padStart(2, '0')
  const html = document.documentElement
  let lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ko'

  function today() {
    const d = new Date()
    const day = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()]
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${day}`
  }

  function tile(game, index, c) {
    const size = SIZES[game.key] || 'sm'
    const [name, desc] = c.games[game.key]
    return `
      <a class="tile t-${size} g-${game.key}" href="#" data-key="${game.key}" data-index="${index}"
         style="--motion:${game.motion}" aria-label="${name}">
        <span class="tile-row" aria-hidden="true">
          <span>${pad2(index + 1)}</span>
          <span class="tile-kind">${c.kinds[game.kind]}</span>
          <span class="tile-hint">${c.tileHint} ↵</span>
        </span>
        <span class="tile-art" aria-hidden="true">
          <svg viewBox="0 0 48 48">${SYMBOLS[game.key]}</svg>
        </span>
        <span class="tile-name">${name}</span>
        <span class="tile-desc">${desc}</span>
      </a>`
  }

  function render() {
    const c = COPY[lang]
    html.lang = lang
    const solo = GAMES.filter((g) => g.kind === 'solo')
    const together = GAMES.filter((g) => g.kind === 'together')
    const counts = [GAMES.length, solo.length, together.length]
    document.querySelector('.hub').innerHTML = `
      <div class="hub-top">
        <section class="hero" aria-labelledby="hero-title">
          <header class="hero-head">
            <span class="hero-logo">
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <path d="${LEAF}" fill="currentColor"/>
                <path d="${LEAF}" fill="var(--brand)" transform="rotate(90 20 20)"/>
                <path d="${LEAF}" fill="currentColor" transform="rotate(270 20 20)"/>
                <path d="${LEAF}" fill="currentColor" transform="rotate(180 20 20)"/>
              </svg>
              <span>${c.brand}</span>
            </span>
            <span class="hero-meta">
              <span class="hero-date">${c.hero.today} <b>${today()}</b></span>
              <nav class="hero-locale" aria-label="language">
                <button type="button" data-lang="ko" ${lang === 'ko' ? 'aria-current="true"' : ''}>ko</button>
                <button type="button" data-lang="en" ${lang === 'en' ? 'aria-current="true"' : ''}>en</button>
              </nav>
            </span>
          </header>
          <h1 id="hero-title">${c.hero.title}</h1>
          <p>${c.hero.sub}</p>
          <dl>
            ${c.hero.counts
              .map(
                (label, i) =>
                  `<div><dt class="${i > 0 && lang === 'ko' ? 'ko' : ''}">${label}</dt><dd>${pad2(counts[i])}</dd></div>`
              )
              .join('')}
          </dl>
        </section>
        ${solo.map((g) => tile(g, GAMES.indexOf(g), c)).join('')}
      </div>
      <div class="hub-bottom">
        ${together.map((g) => tile(g, GAMES.indexOf(g), c)).join('')}
      </div>
      <footer class="hub-foot">
        <p class="hub-status" aria-hidden="true"><i></i><span class="idle">${c.idle}</span></p>
        <small>${c.copyright}</small>
      </footer>`

    /* 언어 전환 */
    document.querySelectorAll('[data-lang]').forEach((b) =>
      b.addEventListener('click', () => {
        lang = b.dataset.lang
        const url = new URL(location.href)
        url.searchParams.set('lang', lang)
        history.replaceState(null, '', url)
        render()
      })
    )

    /* 스포트라이트와 상태 줄 */
    const status = document.querySelector('.hub-status')
    document.querySelectorAll('.tile').forEach((t) => {
      t.addEventListener('click', (e) => e.preventDefault())
      t.addEventListener('pointermove', (e) => {
        const r = t.getBoundingClientRect()
        t.style.setProperty('--mx', `${e.clientX - r.left}px`)
        t.style.setProperty('--my', `${e.clientY - r.top}px`)
      })
      t.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return
        const g = GAMES[+t.dataset.index]
        status.classList.add('on')
        status.innerHTML = `<i></i><span>${pad2(+t.dataset.index + 1)}</span><span class="name">${c.games[g.key][0]}</span><span class="kind">${c.kinds[g.kind]}</span>`
      })
      t.addEventListener('pointerleave', () => {
        status.classList.remove('on')
        status.innerHTML = `<i></i><span class="idle">${c.idle}</span>`
      })
    })
  }

  render()
})()
