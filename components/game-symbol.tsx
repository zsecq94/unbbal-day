import type { ReactNode } from 'react'

/*
 * 48×48 그리드에 그린 라인 심볼. `.f` 패스는 채운다.
 * 스테이지 헤더에서는 28px에 선 2.4px로 그려진다. 선과 선 사이·빈 칸을 8칸
 * (28px에서 약 4.7px) 이상 띄워야 선이 서로 붙지 않는다. 채움은 심볼마다
 * 하나, "결과"나 "고른 것"에만 쓴다. 눈 크기는 원 반지름 16~17, 네모 한 변
 * 34 안팎으로 맞춘다.
 */
const SYMBOLS: Record<string, ReactNode> = {
  fortune: (
    <>
      <circle cx="24" cy="24" r="17" />
      <path d="M24 13 L26.6 21.4 L35 24 L26.6 26.6 L24 35 L21.4 26.6 L13 24 L21.4 21.4 Z" />
    </>
  ),
  /* 뽑힌 공 하나만 채운다 */
  lotto: (
    <>
      <circle cx="24" cy="13" r="7" />
      <circle cx="13" cy="32" r="7" />
      <circle className="f" cx="35" cy="32" r="7.6" />
    </>
  ),
  /* 두 사람(겹친 두 원)과 궁합(채운 교집합) */
  match: (
    <>
      <circle cx="17" cy="24" r="11" />
      <circle cx="31" cy="24" r="11" />
      <path
        className="f"
        d="M24 15.51 A11 11 0 0 1 24 32.49 A11 11 0 0 1 24 15.51 Z"
      />
    </>
  ),
  /* 구슬, 떨어지는 길 위의 점, 두 플리퍼 */
  pinball: (
    <>
      <circle cx="31" cy="11" r="5.5" />
      <path d="M7 30 L19 38" />
      <path d="M41 30 L29 38" />
      <path className="f" d="M21.5 20.5h4.5v4.5h-4.5z" />
    </>
  ),
  /* 세로줄 셋에 엇갈린 가로선. 왼쪽 위에서 출발하면 채운 도착 칸에 닿는다 */
  ladder: (
    <>
      <path d="M10 6 V36 M24 6 V36 M38 6 V36" />
      <path d="M10 13 H24 M24 21 H38 M10 29 H24" />
      <path className="f" d="M34.5 38h7v6h-7z" />
    </>
  ),
  /* 여섯 칸 돌림판과 바늘 */
  wheel: (
    <>
      <circle cx="24" cy="26" r="16" />
      <path d="M8 26 H40 M16 12.14 L32 39.86 M32 12.14 L16 39.86" />
      <path className="f" d="M19.5 2.5 H28.5 L24 8.5 Z" />
    </>
  ),
  /* 바로 세운 편자. 벌어진 굽 끝과 못 자리로 자석과 구분한다 */
  horse: (
    <>
      <path d="M6 8 H16 V24 A8 8 0 0 0 32 24 V8 H42 L40 13 V24 A16 16 0 0 1 8 24 V13 Z" />
      <path
        className="f"
        d="M10.7 17.7h2.6v2.6h-2.6zM34.7 17.7h2.6v2.6h-2.6zM15.2 31.2h2.6v2.6h-2.6zM30.2 31.2h2.6v2.6h-2.6z"
      />
    </>
  ),
  racing: (
    <>
      <path d="M11 42 V6" />
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
