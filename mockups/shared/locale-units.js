/* ───────────────────────────────────────────────────────────────
   운빨데이 · 언어 전환 시안 공용: 언어에 따라 글자가 바뀌는 덩어리
   허브에서 언어가 바뀌면 달라지는 글자 덩어리 22개를 고른다. 앱에서는 이
   자리마다 LocaleText(<ViewTransition name>)가 있고 이름도 같다. 번호·날짜·
   GAMES처럼 두 언어에서 같은 글자는 고르지 않는다(살아 있는 화면에 그대로 남는다).
   ─────────────────────────────────────────────────────────────── */
;(function () {
  /* [이름, 요소] 목록 */
  function units() {
    const q = (s) => document.querySelector(s)
    const list = [
      ['brand', q('.hero-logo span')],
      ['hero-title', q('.hero h1')],
      ['hero-sub', q('.hero p')],
      ['hero-counts', q('.hero dl')],
    ]
    document.querySelectorAll('.tile').forEach((t) => {
      const k = t.dataset.key
      list.push(
        ['kind-' + k, t.querySelector('.tile-kind')],
        ['tile-' + k, t.querySelector('.tile-text')]
      )
    })
    list.push(
      ['status', q('.hub-status .idle')],
      ['copyright', q('.hub-foot small')]
    )
    return list.filter(([, el]) => el)
  }

  window.LocaleUnits = { units }
})()
