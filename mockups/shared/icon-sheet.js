/* ───────────────────────────────────────────────────────────────
   운빨데이 · 게임 아이콘 비교 시트
   shared/hub.js의 심볼(앱과 같음, window.MOCK_SYMBOLS로 갈아 끼울 수 있음)을
   window.PREVIOUS_SYMBOLS(바꾸기 전)와 나란히 놓고, 앱에서 그려지는 크기마다
   그린다. 페이지는 window.ICON_SET에 제목과 아이콘별 설명을 둔다.

   앱에서 심볼이 그려지는 크기(선은 크기와 무관하게 px로 고정):
     큰 타일(운세)   120~190px · 선 1.8
     작은 타일       48~96px  · 선 1.6(혼자 반 칸은 1.8)
     스테이지 헤더   28px     · 선 2.4 · 강조색
     준비 중 화면    96~152px · 선 1.4
   ─────────────────────────────────────────────────────────────── */
;(function () {
  const GAME_ORDER = ['fortune', 'lotto', 'match', 'pinball', 'ladder', 'wheel', 'horse', 'racing']

  const svg = (body, cls = '') => `<svg class="sym ${cls}" viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`

  function render() {
    const root = document.querySelector('.icon-sheet')
    const set = window.ICON_SET
    if (!root || !set || !window.MockHub) return
    const lang = window.MockHub.lang
    const copy = window.MockHub.COPY[lang]
    const now = window.PREVIOUS_SYMBOLS
    const next = window.MockHub.SYMBOLS

    root.innerHTML = `
      <header class="is-head">
        <p class="is-eyebrow">게임 아이콘 · ${set.label}</p>
        <h1>${set.title}</h1>
        <p class="is-sum">${set.summary}</p>
        <ul class="is-rules">${set.rules.map((r) => `<li>${r}</li>`).join('')}</ul>
      </header>
      <div class="is-legend" aria-hidden="true">
        <span>게임</span><span>이전</span><span>큰 타일 · 152</span><span>작은 타일 · 64</span><span>헤더 · 28</span><span>준비 중 · 112</span>
      </div>
      <ol class="is-list">
        ${GAME_ORDER.map((key, i) => {
          const name = copy.games[key][0]
          return `
          <li class="is-row">
            <div class="is-name">
              <span class="is-no">${String(i + 1).padStart(2, '0')}</span>
              <b>${name}</b>
              <p>${set.notes[key]}</p>
            </div>
            <div class="is-cell is-now">
              ${svg(now[key], 's-64')}
              <span class="is-hd">${svg(now[key], 's-28')}<b>${name}</b></span>
            </div>
            <div class="is-cell">${svg(next[key], 's-152')}</div>
            <div class="is-cell is-pair">${svg(next[key], 's-64')}${svg(next[key], 's-64 lit')}</div>
            <div class="is-cell"><span class="is-hd">${svg(next[key], 's-28')}<b>${name}</b></span></div>
            <div class="is-cell is-soon">${svg(next[key], 's-112')}</div>
          </li>`
        }).join('')}
      </ol>
      <section class="is-strip" aria-label="한 줄로 보기">
        <p>한 줄로 보기 · 크기와 무게가 고른지</p>
        <div>${GAME_ORDER.map((k) => svg(next[k], 's-64')).join('')}</div>
        <div class="tiny">${GAME_ORDER.map((k) => svg(next[k], 's-28')).join('')}</div>
      </section>
      <p class="is-hub-note">아래는 같은 아이콘을 넣은 허브입니다. 타일에 마우스를 올리면 강조색과 호버 모션을 봅니다.</p>`
  }

  window.addEventListener('load', () => {
    render()
    /* 허브 언어 버튼을 누르면 시트의 게임 이름도 바꾼다 */
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-lang]')) requestAnimationFrame(render)
    })
  })
})()
