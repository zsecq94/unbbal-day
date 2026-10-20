import { notFound } from 'next/navigation'

/**
 * Anything under a locale that no other route claims. Rendered by
 * `app/[lang]/not-found.tsx`; the proxy also rewrites unknown game keys here.
 */
export default function CatchAll() {
  notFound()
}

/* A 404 never needs to be an instant navigation; skip the dev validation. */
export const instant = false
