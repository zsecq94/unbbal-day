import {
  ViewTransition,
  type ReactElement,
  type ViewTransitionClass,
} from 'react'
import { NAV_LOCALE, textTransition } from '@/lib/transitions'

type Align = 'start' | 'center' | 'end'

/** 덩어리를 어느 쪽에 맞춰 그리는지. 이미지를 같은 쪽에 붙인다(`.words-*`). */
const SHARE: Record<Align, ViewTransitionClass> = {
  start: { [NAV_LOCALE]: 'words', default: 'none' },
  center: { [NAV_LOCALE]: 'words words-center', default: 'none' },
  end: { [NAV_LOCALE]: 'words words-end', default: 'none' },
}

/**
 * 언어에 따라 바뀌는 글자 덩어리. 언어를 바꾸면 틀은 제자리에 둔 채 이 글자만
 * 빠졌다 들어온다(`app/globals.css`의 `.words`). 다른 이동에서는 이름을 붙이지
 * 않아 페이지와 함께 움직인다.
 *
 * 자식은 박스 하나로 그려지는 요소 하나여야 한다(여러 줄에 걸친 인라인은
 * 스냅샷을 못 뜬다). `name`은 한 페이지 안에서 겹치지 않게 짓는다. 다른 언어의
 * 같은 페이지에서 같은 이름끼리 짝이 된다.
 *
 * 덩어리가 오른쪽(`end`)이나 가운데(`center`)에 맞춰 놓이면 `align`으로 알린다.
 * 언어마다 폭이 달라서, 이전 글자를 새 덩어리의 왼쪽 끝에 그리면 옆으로 튄다.
 */
export function LocaleText({
  name,
  align = 'start',
  children,
}: {
  name: string
  align?: Align
  children: ReactElement
}) {
  return (
    <ViewTransition
      name={textTransition(name)}
      share={SHARE[align]}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}
