/**
 * 전체 페이지를 불러올 때 HTML 파싱 중에 실행되는 인라인 스크립트.
 * 클라이언트에서는 실행되지 않는 `text/plain`으로 그려서, 소프트 이동 중
 * (어차피 스크립트가 실행되지 않는다) React가 script 태그를 경고하지 않게 한다.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
