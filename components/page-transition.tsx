import { ViewTransition, type ReactNode } from 'react'
import { NAV_BACK, NAV_FORWARD } from '@/lib/transitions'

const BY_TYPE = {
  [NAV_FORWARD]: NAV_FORWARD,
  [NAV_BACK]: NAV_BACK,
  default: 'none',
}

/**
 * Wraps a page's single root element so route changes animate by direction.
 * Untyped navigations (browser back, refresh) swap instantly; shared elements
 * named inside still morph on their own.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={BY_TYPE} exit={BY_TYPE} default="none">
      {children}
    </ViewTransition>
  )
}
