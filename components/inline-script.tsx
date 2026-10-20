/**
 * An inline script that runs during HTML parsing on full page loads.
 * On the client it renders as inert `text/plain`, so React doesn't warn about
 * script tags during soft navigations (where scripts never execute anyway).
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
