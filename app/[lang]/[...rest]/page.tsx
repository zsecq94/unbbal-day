import { notFound } from 'next/navigation'

/**
 * 로케일 아래에서 다른 어떤 라우트에도 걸리지 않는 경로. 화면은
 * `app/[lang]/not-found.tsx`가 그리고, 모르는 게임 키도 proxy가 여기로 리라이트한다.
 */
export default function CatchAll() {
  notFound()
}

/* 404는 즉시 이동일 필요가 없으므로 개발 모드 검증을 건너뛴다. */
export const instant = false
