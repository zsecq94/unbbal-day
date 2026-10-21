/* Shared chrome: the top bar and the stage header, same structure as
   components/top-bar.tsx and components/game-stage.tsx. Pages leave
   <header data-chrome="top-bar"> and <header data-chrome="stage-head">
   placeholders; this fills them synchronously before the page script runs. */
;(() => {
  const LEAF = 'M19 19H10A9 9 0 0 1 1 10A9 9 0 0 1 10 1A9 9 0 0 1 19 10Z'
  const LOGO = `
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="${LEAF}" fill="currentColor" />
      <path d="${LEAF}" fill="var(--brand)" transform="rotate(90 20 20)" />
      <path d="${LEAF}" fill="currentColor" transform="rotate(270 20 20)" />
      <path d="${LEAF}" fill="currentColor" transform="rotate(180 20 20)" />
    </svg>`
  const FORTUNE = `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="16" />
      <path d="M24 15.5 L26.2 21.8 L32.5 24 L26.2 26.2 L24 32.5 L21.8 26.2 L15.5 24 L21.8 21.8 Z" />
    </svg>`

  // The back link leads to the mockup list; the list itself has none.
  const home = document.body.dataset.home ?? 'index.html'
  const back = home
    ? `<a class="btn back" href="${home}" aria-label="시안 목록으로 돌아가기">
        <span class="mono" aria-hidden="true">←</span><span>홈</span>
      </a>`
    : ''

  document.querySelectorAll('[data-chrome="top-bar"]').forEach((el) => {
    el.classList.add('top-bar')
    el.innerHTML = `
      ${back}
      <span class="logo">${LOGO}<span>운빨데이</span></span>
      <nav class="locale" aria-label="언어 선택">
        <a href="#" lang="ko" aria-label="한국어" aria-current="true">ko</a>
        <a href="#" lang="en" aria-label="English">en</a>
      </nav>`
    el.querySelectorAll('.locale a').forEach((a) =>
      a.addEventListener('click', (e) => e.preventDefault())
    )
  })

  document.querySelectorAll('[data-chrome="stage-head"]').forEach((el) => {
    el.classList.add('stage-head')
    el.innerHTML = `
      <span class="label" aria-hidden="true">01</span>
      <span class="who">${FORTUNE}<h1 id="game-title">오늘의 운세</h1></span>
      <span class="kind">혼자</span>`
  })
})()
