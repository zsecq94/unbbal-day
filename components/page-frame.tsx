import type { ReactNode } from 'react'

/** Page body for every screen outside the hub: same gutters as the hub grid. */
export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[1920px] flex-col gap-3 px-4 py-4 sm:px-6 sm:py-6 xl:px-10 xl:py-10">
      {children}
    </main>
  )
}
