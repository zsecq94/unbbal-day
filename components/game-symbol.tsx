import type { ReactNode } from 'react'

/* Line symbols drawn on a 48×48 grid. `.f` paths are filled. */
const SYMBOLS: Record<string, ReactNode> = {
  fortune: (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="M24 15.5 L26.2 21.8 L32.5 24 L26.2 26.2 L24 32.5 L21.8 26.2 L15.5 24 L21.8 21.8 Z" />
    </>
  ),
  lotto: (
    <>
      <circle cx="24" cy="15" r="6.5" />
      <circle cx="15" cy="31" r="6.5" />
      <circle cx="33" cy="31" r="6.5" />
    </>
  ),
  /* 이름 획수가 한 줄씩 줄어드는 삼각형. 마지막 두 칸이 궁합 점수다. */
  match: (
    <>
      <path d="M5 9h7v7h-7zM15.5 9h7v7h-7zM26 9h7v7h-7zM36.5 9h7v7h-7z" />
      <path d="M10.25 20.5h7v7h-7zM20.75 20.5h7v7h-7zM31.25 20.5h7v7h-7z" />
      <path className="f" d="M15.5 32h7v7h-7zM26 32h7v7h-7z" />
    </>
  ),
  pinball: (
    <>
      <circle cx="29" cy="13" r="5.5" />
      <path d="M7 31 L20 39" />
      <path d="M41 31 L28 39" />
      <path className="f" d="M22.5 23.5h2.5v2.5h-2.5z" />
    </>
  ),
  ladder: (
    <>
      <path d="M14 7 V41" />
      <path d="M34 7 V41" />
      <path d="M14 15 H34" />
      <path d="M14 25 H34" />
      <path d="M14 34 H34" />
    </>
  ),
  wheel: (
    <>
      <circle cx="24" cy="25" r="16" />
      <path d="M24 9 V41" />
      <path d="M8 25 H40" />
      <path className="f" d="M20 2 H28 L24 8 Z" />
    </>
  ),
  horse: (
    <>
      <path d="M14 40 V24 A10 10 0 0 1 34 24 V40" />
      <path d="M9 40 H19" />
      <path d="M29 40 H39" />
    </>
  ),
  racing: (
    <>
      <path d="M11 43 V6" />
      <rect x="11" y="8" width="27" height="20" />
      <path className="f" d="M11 8h9v10h-9zM29 8h9v10h-9zM20 18h9v10h-9z" />
    </>
  ),
}

export function GameSymbol({
  gameKey,
  className,
}: {
  gameKey: string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={`overflow-visible fill-none stroke-current [stroke-linecap:square] [&_*]:[vector-effect:non-scaling-stroke] [&_.f]:fill-current [&_.f]:stroke-none ${className ?? ''}`}
    >
      {SYMBOLS[gameKey]}
    </svg>
  )
}
