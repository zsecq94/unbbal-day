import type { GameKey } from '@/lib/games'
import type { Locale } from '@/lib/i18n'

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
/** 같은 페이지를 다른 언어로 바꾼다. 페이지는 제자리에 있고 글자만 바뀐다. */
export const NAV_LOCALE = 'nav-locale'
/** 언어 전환의 방향(갈 언어). 글자가 들어오는 쪽과 동전이 도는 쪽을 정한다. */
export const toLocale = (locale: Locale) => `to-${locale}`

/**
 * 페이지를 오갈 때만 모프하는 공유 요소의 클래스. 언어 전환에서는 같은 자리에
 * 같은 모양이라 이름을 끈다(크기가 조금만 달라도 레이아웃 애니메이션이 된다).
 */
export const SHARE_GROW = { [NAV_LOCALE]: 'none', default: 'grow' }
export const SHARE_MORPH = { [NAV_LOCALE]: 'none', default: 'morph' }

/** 브랜드 마크가 히어로에서 게임 상단바로 옮겨 간다. */
export const BRAND_TRANSITION = 'brand'
/** 누른 타일이 게임 스테이지 프레임으로 자라난다. */
export const tileTransition = (key: GameKey) => `tile-${key}`
/** 타일 심볼이 스테이지 헤더에 내려앉는다. */
export const symbolTransition = (key: GameKey) => `symbol-${key}`
/** 지금 언어 칩. 언어를 바꾸면 동전처럼 뒤집히며 갈 언어 칸으로 옮겨 간다. */
export const LOCALE_COIN_TRANSITION = 'locale-coin'
/** 언어에 따라 바뀌는 글자 덩어리. 언어를 바꾸면 제자리에서 갈아 끼운다. */
export const textTransition = (key: string) => `text-${key}`
