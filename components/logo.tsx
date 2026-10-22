import { LocaleText } from '@/components/locale-text'

const LEAF = 'M19 19H10A9 9 0 0 1 1 10A9 9 0 0 1 10 1A9 9 0 0 1 19 10Z'

/**
 * 네 잎 클로버 마크. 바깥 세 모서리만 둥근 사각형 네 장이 중심을 향해 모인다.
 * 오른쪽 위 잎 하나만 브랜드 블루로 칠한 "행운의 한 잎".
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <path d={LEAF} fill="currentColor" />
      <path d={LEAF} fill="var(--color-brand)" transform="rotate(90 20 20)" />
      <path d={LEAF} fill="currentColor" transform="rotate(270 20 20)" />
      <path d={LEAF} fill="currentColor" transform="rotate(180 20 20)" />
    </svg>
  )
}

/** 언어와 무관한 클로버 아이콘 + 페이지 언어의 브랜드명. */
export function Logo({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-[11px]">
      <LogoMark className="size-[30px] shrink-0 text-ink drop-shadow-[0_0_14px_rgb(31_91_255/0.35)]" />
      <LocaleText name="brand">
        <span className="text-[23px] leading-none font-[800] tracking-[-0.045em] whitespace-nowrap [&:lang(en)]:tracking-[-0.03em]">
          {name}
        </span>
      </LocaleText>
    </span>
  )
}
