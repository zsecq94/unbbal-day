import { Fragment, useSyncExternalStore, type ReactNode } from 'react'

/** `{name}` 자리를 채운다. */
export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))

const query = '(prefers-reduced-motion: reduce)'
const subscribe = (cb: () => void) => {
  const mq = matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
/** 동작 줄이기 설정. 서버와 첫 렌더에서는 꺼진 것으로 본다. */
export const useReducedMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false
  )

/** 사전의 강조 배열(`["…", { "b": "…" }]`)을 그린다. */
export function rich(parts: (string | { b: string })[]) {
  return parts.map((p, i) =>
    typeof p === 'string' ? (
      <Fragment key={i}>{p}</Fragment>
    ) : (
      <b key={i} className="font-bold text-ink">
        {p.b}
      </b>
    )
  )
}

/** `{name}` 자리에 글이나 요소를 넣는다. */
export function compose(template: string, vars: Record<string, ReactNode>) {
  return template
    .split(/(\{\w+\})/)
    .map((part, i) => {
      const key = /^\{(\w+)\}$/.exec(part)?.[1]
      return key ? <Fragment key={i}>{vars[key]}</Fragment> : part
    })
    .filter((p) => p !== '')
}
