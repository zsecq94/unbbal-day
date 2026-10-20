import type { GameKey } from '@/lib/games'

/**
 * Page transition vocabulary.
 *
 * Links tag a navigation with a transition type (`<Link transitionTypes>`),
 * and each page maps the type to its enter/exit motion via `PageTransition`.
 * Shared element names pair an element on the outgoing page with one on the
 * incoming page so the browser morphs between them. The matching CSS lives in
 * `app/globals.css` under "View transitions".
 */

/** Going deeper: hub → game. */
export const NAV_FORWARD = 'nav-forward'
/** Coming back up: game → hub. */
export const NAV_BACK = 'nav-back'

/** The brand mark travels from the hero into the game top bar. */
export const BRAND_TRANSITION = 'brand'
/** The pressed tile grows into the game stage frame. */
export const tileTransition = (key: GameKey) => `tile-${key}`
/** The tile symbol lands in the stage header. */
export const symbolTransition = (key: GameKey) => `symbol-${key}`
