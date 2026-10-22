import { ViewTransition, type ReactNode } from 'react'
import { NAV_BACK, NAV_FORWARD } from '@/lib/transitions'

const BY_TYPE = {
  [NAV_FORWARD]: NAV_FORWARD,
  [NAV_BACK]: NAV_BACK,
  default: 'none',
}

/**
 * 페이지의 하나뿐인 루트 요소를 감싸 경로가 바뀔 때 방향에 맞춰 움직이게 한다.
 * 타입 없는 이동(브라우저 뒤로가기, 새로고침)은 즉시 바뀌고, 안에서 이름 붙인
 * 공유 요소는 그래도 따로 모프한다.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={BY_TYPE} exit={BY_TYPE} default="none">
      {children}
    </ViewTransition>
  )
}
