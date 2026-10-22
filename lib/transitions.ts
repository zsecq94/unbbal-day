import type { GameKey } from '@/lib/games'

/**
 * 페이지 전환 어휘.
 *
 * 링크는 이동에 전환 타입을 붙이고(`<Link transitionTypes>`), 각 페이지는
 * `PageTransition`으로 그 타입을 들어오고 나가는 모션에 연결한다. 공유 요소
 * 이름은 나가는 페이지와 들어오는 페이지의 요소를 짝지어 브라우저가 그 사이를
 * 모프하게 한다. 짝이 되는 CSS는 `app/globals.css`의 "View transitions"에 있다.
 */

/** 안으로 들어간다: 허브 → 게임. */
export const NAV_FORWARD = 'nav-forward'
/** 밖으로 돌아온다: 게임 → 허브. */
export const NAV_BACK = 'nav-back'

/** 브랜드 마크가 히어로에서 게임 상단바로 옮겨 간다. */
export const BRAND_TRANSITION = 'brand'
/** 누른 타일이 게임 스테이지 프레임으로 자라난다. */
export const tileTransition = (key: GameKey) => `tile-${key}`
/** 타일 심볼이 스테이지 헤더에 내려앉는다. */
export const symbolTransition = (key: GameKey) => `symbol-${key}`
