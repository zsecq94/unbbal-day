/* Shared behaviour for the fortune mockups: the profile/accuracy model, a
   sample fortune generator, motion helpers that respect reduced motion and
   the "one thing moves at a time" rule, and small layout helpers.
   Exposed as the global `Kit`. */
window.Kit = (() => {
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  const reduced = () => motionQuery.matches
  const demo = new URLSearchParams(location.search).has('demo')

  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
  const isHangul = (c) => /[가-힣]/.test(c)

  /* ─── Profile ────────────────────────────────────────────────────── */
  const DOMAINS = [
    { key: 'love', name: '애정', code: 'LOVE' },
    { key: 'money', name: '금전', code: 'MONEY' },
    { key: 'health', name: '건강', code: 'HEALTH' },
    { key: 'work', name: '일', code: 'WORK' },
    { key: 'people', name: '관계', code: 'PEOPLE' },
  ]
  const domainName = (key) => DOMAINS.find((d) => d.key === key)?.name ?? ''

  const emptyProfile = () => ({
    year: '',
    month: '',
    day: '',
    time: '',
    calendar: '',
    gender: '',
    name: '',
    interests: [],
  })

  /** Demo profile: everything but gender, so the result shows 90%. */
  const SAMPLE = {
    year: '1994',
    month: '03',
    day: '12',
    time: '14:30',
    calendar: 'solar',
    gender: '',
    name: '김하늘',
    interests: ['money'],
  }

  const THIS_YEAR = new Date().getFullYear()
  const daysIn = (y, m) => new Date(y || 2000, m, 0).getDate()
  const okYear = (p) => /^\d{4}$/.test(p.year) && +p.year >= 1900 && +p.year <= THIS_YEAR
  const okMonth = (p) => /^\d{1,2}$/.test(p.month) && +p.month >= 1 && +p.month <= 12
  const okDay = (p) =>
    /^\d{1,2}$/.test(p.day) &&
    +p.day >= 1 &&
    +p.day <= (okMonth(p) ? daysIn(+p.year, +p.month) : 31)
  const okTime = (p) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(p.time || '')
    return !!m && +m[1] < 24 && +m[2] < 60
  }
  const dateValid = (p) => okYear(p) && okMonth(p) && okDay(p)

  /** What each answer is worth. The birth date alone gets you to 40. */
  const PARTS = [
    { key: 'year', label: '태어난 해', weight: 16, ok: okYear },
    { key: 'month', label: '태어난 달', weight: 12, ok: okMonth },
    { key: 'day', label: '태어난 날', weight: 12, ok: okDay },
    { key: 'time', label: '태어난 시각', weight: 22, ok: okTime },
    { key: 'name', label: '이름', weight: 12, ok: (p) => p.name.trim().length >= 2 },
    { key: 'gender', label: '성별', weight: 10, ok: (p) => !!p.gender },
    { key: 'calendar', label: '양력·음력', weight: 8, ok: (p) => !!p.calendar },
    { key: 'interests', label: '관심 분야', weight: 8, ok: (p) => p.interests.length > 0 },
  ]
  const accuracy = (p) => PARTS.reduce((a, part) => a + (part.ok(p) ? part.weight : 0), 0)
  const weightOf = (key) => PARTS.find((x) => x.key === key)?.weight ?? 0
  const filled = (p, key) => !!PARTS.find((x) => x.key === key)?.ok(p)

  const ZODIAC = ['원숭이', '닭', '개', '돼지', '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양']
  const zodiac = (year) => ZODIAC[+year % 12]
  const STARS = [
    [1, 20, '염소자리'], [2, 19, '물병자리'], [3, 21, '물고기자리'], [4, 20, '양자리'],
    [5, 21, '황소자리'], [6, 22, '쌍둥이자리'], [7, 23, '게자리'], [8, 23, '사자자리'],
    [9, 23, '처녀자리'], [10, 23, '천칭자리'], [11, 23, '전갈자리'], [12, 22, '사수자리'],
  ]
  const star = (m, d) => {
    const [, cut, name] = STARS[m - 1]
    return d < cut ? name : STARS[m % 12][2]
  }
  const SIJIN = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
  /** Traditional two-hour block for a clock hour (자시 = 23–01). */
  const sijin = (hour) => SIJIN[Math.floor(((hour + 1) % 24) / 2)] + '시'
  const givenName = (name) => {
    const n = name.trim()
    return n.length === 3 ? n.slice(1) : n
  }

  /* ─── Sample fortune ─────────────────────────────────────────────── */
  function hash(str) {
    let h = 2166136261
    for (const c of str) {
      h ^= c.codePointAt(0)
      h = Math.imul(h, 16777619)
    }
    return h >>> 0
  }
  function rng(seed) {
    let a = seed >>> 0
    return () => {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  const pick = (r, list) => list[Math.floor(r() * list.length)]
  const band = (score) => (score >= 82 ? 0 : score >= 68 ? 1 : 2)

  const HEADLINES = [
    ['막혔던 일이 풀리는 날', '먼저 내민 손이 돌아오는 날', '작은 운이 겹겹이 쌓이는 날'],
    ['한 걸음씩 가도 늦지 않은 날', '작은 선택이 흐름을 바꾸는 날', '익숙한 길에서 답을 찾는 날'],
    ['쉬어 가며 힘을 모으는 날', '서두르지 않아야 지키는 날', '조용히 정리하면 가벼워지는 날'],
  ]
  const SUMMARIES = [
    '오래 미뤄 둔 일을 꺼내도 좋아요. 생각보다 쉽게 풀려요.',
    '크게 벌이기보다 하던 일을 다듬을 때 운이 따라와요.',
    '오늘은 속도를 늦추고 컨디션을 먼저 챙기세요.',
  ]
  const TOTAL_WORDS = ['술술풀림', '한걸음씩', '쉬어가기']
  const LINES = {
    love: ['마음을 표현하면 그대로 닿아요', '천천히 다가갈수록 좋아요', '말보다 들어 주는 쪽이 나아요'],
    money: ['뜻밖의 작은 수입이 보여요', '지출만 지키면 무난해요', '큰 결제는 내일로 미뤄요'],
    health: ['몸이 가볍고 회복이 빨라요', '물 한 잔, 스트레칭 한 번', '잠을 먼저 챙기세요'],
    work: ['미뤄 둔 일을 끝내기 좋아요', '오후에 집중력이 올라와요', '확인을 한 번 더 하세요'],
    people: ['오랜만의 연락이 반가워요', '가까운 사람과 무난해요', '말 한마디를 아껴 두세요'],
  }
  const WORDS = {
    love: ['표현하기', '천천히', '들어주기'],
    money: ['작은수입', '지출지키기', '결제미루기'],
    health: ['가벼운몸', '스트레칭', '잠먼저'],
    work: ['마무리', '오후집중', '재확인'],
    people: ['반가운연락', '무난함', '말아끼기'],
  }
  const ADVICE = {
    love: ['먼저 안부를 물어보세요', '지난 일은 꺼내지 마세요'],
    money: ['영수증을 한 번 정리해요', '충동구매는 하루만 참아요'],
    health: ['점심 뒤 10분 걷기', '늦은 밤 카페인'],
    work: ['가장 미룬 일 하나 끝내기', '회의에서 바로 답하기'],
    people: ['고마운 사람에게 한 줄', '단체 대화방 논쟁'],
  }
  const HOUR_NOTES = [
    ['중요한 연락은 이때 하세요', '결정을 내리기 좋은 시간', '사람을 만나면 득이 돼요'],
    ['무난하게 흘러가요', '하던 일을 이어 가요', '가벼운 정리에 알맞아요'],
    ['서두르지 말고 쉬어 가요', '확인을 한 번 더 하세요', '큰 결정은 미뤄 두세요'],
  ]
  const COLORS = [
    { name: '코발트 블루', hex: '#4f86ff' },
    { name: '아이보리', hex: '#f3f3ef' },
    { name: '차콜', hex: '#3a3a38' },
    { name: '은회색', hex: '#aaaaa4' },
  ]
  const DIRECTIONS = [
    { name: '북', code: 'N' },
    { name: '북동', code: 'NE' },
    { name: '동', code: 'E' },
    { name: '남동', code: 'SE' },
    { name: '남', code: 'S' },
    { name: '남서', code: 'SW' },
    { name: '서', code: 'W' },
    { name: '북서', code: 'NW' },
  ]

  /** Two-hour block i as "오후 2–4시", glued so it never wraps inside. */
  function blockLabel(i) {
    const s = i * 2
    const e = s + 2
    const half = (h) => (h < 12 ? '오전' : '오후')
    const h12 = (h) => (h % 12 === 0 ? 12 : h % 12)
    const label =
      half(s) === half(e % 24) || e === 24
        ? `${half(s)} ${h12(s)}–${h12(e)}시`
        : `${half(s)} ${h12(s)}시–${half(e)} ${h12(e)}시`
    return label.replace(/ /g, ' ').replace(/–/g, '⁠–⁠')
  }

  function series(r, mean, spread) {
    const out = []
    let v = mean + (r() - 0.5) * spread
    for (let i = 0; i < 12; i++) {
      v += (r() - 0.5) * spread * 0.9 + (mean - v) * 0.35
      out.push(Math.round(clamp(v, 22, 98)))
    }
    return out
  }

  function fortune(p) {
    const today = new Date()
    const key = [p.year, p.month, p.day, p.time, p.calendar, p.gender, p.name, p.interests.join('+')].join('|')
    const r = rng(hash(key + today.toDateString()))
    const acc = accuracy(p)

    const domains = DOMAINS.map((d) => {
      const score = Math.round(48 + r() * 47)
      const b = band(score)
      return {
        ...d,
        score,
        line: LINES[d.key][b],
        word: WORDS[d.key][b],
        advice: ADVICE[d.key],
        hours: series(r, score, 34),
      }
    })
    const total = Math.round(domains.reduce((a, d) => a + d.score, 0) / domains.length + 6)
    const hours = series(r, total, 30)
    const best = hours.indexOf(Math.max(...hours))
    hours[best] = Math.max(hours[best], Math.min(97, total + 9))
    const worst = hours.indexOf(Math.min(...hours))
    const tb = band(total)
    const ranked = [...domains].sort((a, b) => b.score - a.score)

    return {
      total,
      accuracy: acc,
      /** ± on scores: the less we know, the wider. */
      err: Math.round(((100 - acc) * 0.16 + 2) * 10) / 10,
      headline: pick(r, HEADLINES[tb]),
      summary: SUMMARIES[tb],
      word: TOTAL_WORDS[tb],
      domains,
      top: ranked[0],
      low: ranked[ranked.length - 1],
      hours,
      best,
      worst,
      hourNotes: hours.map((v) => pick(r, HOUR_NOTES[band(v)])),
      lucky: {
        color: pick(r, COLORS),
        number: 1 + Math.floor(r() * 45),
        direction: { ...pick(r, DIRECTIONS) },
        time: { block: best, label: blockLabel(best) },
      },
      who: p.name.trim() ? `${givenName(p.name)} 님` : '',
      zodiac: okYear(p) ? zodiac(p.year) : '',
      star: okMonth(p) && okDay(p) ? star(+p.month, +p.day) : '',
    }
  }
  DIRECTIONS.forEach((d, i) => (d.index = i))

  /* ─── Motion ─────────────────────────────────────────────────────── */
  const moving = () => document.body.classList.contains('is-moving')

  /** Count a number up/down in place, zero-padded. */
  function tween(el, to, { dur = 700, len = 2, delay = 0 } = {}) {
    cancelAnimationFrame(el._tw)
    const from = Number(el.dataset.v ?? 0)
    el.dataset.v = to
    if (reduced() || dur === 0 || from === to) {
      el.textContent = pad(to, len)
      return Promise.resolve()
    }
    return new Promise((done) => {
      const t0 = performance.now() + delay
      const step = (now) => {
        const t = clamp((now - t0) / dur, 0, 1)
        const e = 1 - Math.pow(1 - t, 3)
        el.textContent = pad(Math.round(from + (to - from) * e), len)
        if (t < 1) el._tw = requestAnimationFrame(step)
        else done()
      }
      el._tw = requestAnimationFrame(step)
    })
  }

  const LATIN = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const SYLLABLES = '가나다라마바사아자차카타파하운빨데이오늘'
  /** Letters settle left to right out of noise. */
  function scramble(el, text, { dur = 420 } = {}) {
    cancelAnimationFrame(el._sc)
    if (reduced() || !el.isConnected) {
      el.textContent = text
      return Promise.resolve()
    }
    const r = Math.random
    return new Promise((done) => {
      const t0 = performance.now()
      const step = (now) => {
        const t = clamp((now - t0) / dur, 0, 1)
        const shown = Math.floor(t * text.length)
        let out = ''
        for (let i = 0; i < text.length; i++) {
          const c = text[i]
          if (i < shown || /[\s·.,:–\-/()]/.test(c)) out += c
          else out += isHangul(c) ? SYLLABLES[Math.floor(r() * SYLLABLES.length)] : LATIN[Math.floor(r() * LATIN.length)]
        }
        el.textContent = t < 1 ? out : text
        if (t < 1) el._sc = requestAnimationFrame(step)
        else done()
      }
      el._sc = requestAnimationFrame(step)
    })
  }

  /**
   * Swap the input view for the result view (or back). The old view leaves
   * (120ms), then the new one arrives (220ms). Idle effects hold still while
   * this runs; `after` starts the new view's own entrance once it's settled.
   */
  async function swap(from, to, { state, after } = {}) {
    const body = document.body
    body.classList.add('is-moving')
    if (!reduced()) {
      await from.animate(
        [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-6px)' }],
        { duration: 120, easing: 'ease-in', fill: 'forwards' }
      ).finished
    }
    from.hidden = true
    from.getAnimations().forEach((a) => a.cancel())
    if (state) body.dataset.state = state
    to.hidden = false
    window.scrollTo(0, 0)
    if (!reduced()) {
      await to.animate(
        [
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 300, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' }
      ).finished
    }
    body.classList.remove('is-moving')
    after?.()
  }

  /** Hold idle effects still while an in-page transition of `ms` runs. */
  let holdTimer = 0
  function hold(ms) {
    if (reduced()) return
    document.body.classList.add('is-moving')
    clearTimeout(holdTimer)
    holdTimer = setTimeout(() => document.body.classList.remove('is-moving'), ms)
  }

  /** setInterval for ambient effects: skipped while hidden, moving or reduced. */
  function idle(fn, ms) {
    const id = setInterval(() => {
      if (document.hidden || moving() || reduced()) return
      fn()
    }, ms)
    return () => clearInterval(id)
  }

  /** Keep `--vv-top` in step with the visual viewport (iOS keyboard pan). */
  function pinViewport() {
    const vv = window.visualViewport
    if (!vv) return
    const set = () =>
      document.documentElement.style.setProperty('--vv-top', `${Math.max(0, vv.offsetTop)}px`)
    vv.addEventListener('resize', set)
    vv.addEventListener('scroll', set)
    set()
  }

  /**
   * Largest font size (px) at which `el`'s content still fits its own box.
   * The box must be sized by layout, not by its content.
   */
  function fitText(el, { min = 14, max = 64 } = {}) {
    const fits = () => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1
    const run = () => {
      if (!el.clientHeight) return
      el.style.fontSize = `${max}px`
      if (fits()) return
      let lo = min
      let hi = max
      while (hi - lo > 0.25) {
        const mid = (lo + hi) / 2
        el.style.fontSize = `${mid}px`
        if (fits()) lo = mid
        else hi = mid
      }
      el.style.fontSize = `${Math.floor(lo * 4) / 4}px`
    }
    new ResizeObserver(run).observe(el)
    run()
    return run
  }

  /** Pointer position inside an element as CSS vars, for cursor highlights. */
  function trackPointer(el, { x = '--px', y = '--py' } = {}) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty(x, `${e.clientX - r.left}px`)
      el.style.setProperty(y, `${e.clientY - r.top}px`)
    })
  }

  pinViewport()

  return {
    reduced,
    demo,
    wait,
    pad,
    clamp,
    isHangul,
    DOMAINS,
    domainName,
    emptyProfile,
    SAMPLE,
    PARTS,
    accuracy,
    weightOf,
    filled,
    dateValid,
    okYear,
    okMonth,
    okDay,
    okTime,
    daysIn,
    THIS_YEAR,
    zodiac,
    star,
    sijin,
    givenName,
    hash,
    rng,
    fortune,
    blockLabel,
    DIRECTIONS,
    tween,
    scramble,
    swap,
    hold,
    idle,
    moving,
    fitText,
    trackPointer,
  }
})()
