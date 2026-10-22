/** 오행 다섯 막대. 용신이 정해지면 그 막대에 불이 들어온다. */
export function ElementBars({
  counts,
  names,
  mark,
  reduced,
}: {
  counts: number[]
  names: string[]
  mark: number | null
  reduced: boolean
}) {
  const max = Math.max(...counts, 1)
  return (
    <span className="flex h-[1.6em] items-end gap-[0.7em]">
      {counts.map((c, i) => (
        <span key={i} className="flex h-full items-end gap-1.5">
          <i
            aria-hidden="true"
            style={{
              height: c ? `${(c / max) * 100}%` : '2px',
              animationDelay: reduced ? undefined : `${i * 70}ms`,
            }}
            className={`w-[0.32em] origin-bottom transition-colors duration-300 motion-reduce:animate-none ${
              reduced ? '' : 'animate-grow'
            } ${mark === i ? 'bg-brand-hi' : c ? 'bg-ink-2' : 'bg-line-strong'}`}
          />
          <span
            className={`font-mono text-[0.48em] leading-none font-medium transition-colors duration-300 ${
              mark === i ? 'text-brand-hi' : 'text-ink-3'
            }`}
          >
            {names[i]} {c}
          </span>
        </span>
      ))}
    </span>
  )
}
