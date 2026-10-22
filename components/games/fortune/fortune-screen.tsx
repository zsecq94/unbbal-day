'use client'

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import type { Dictionary } from '@/app/[lang]/dictionaries'
import {
  accuracy,
  dateValid,
  EMPTY_PROFILE,
  makeFortune,
  PARTS,
  partOk,
  signIndex,
  timeValid,
  zodiacIndex,
  type Fortune,
  type PartKey,
  type Profile,
} from '@/lib/fortune'
import type { Locale } from '@/lib/i18n'
import { FortuneResult } from './fortune-result'
import { fill, hourLabel, useReducedMotion } from './shared'

export type FortuneCopy = Dictionary['fortune']

type PickKey = 'calendar' | 'gender'
const PICK_KEYS: PickKey[] = ['calendar', 'gender']
const isPick = (key: PartKey): key is PickKey =>
  PICK_KEYS.includes(key as PickKey)
const TEXT_KEYS: PartKey[] = ['year', 'month', 'day', 'time', 'name']

const digits = (v: string, n: number) => v.replace(/\D/g, '').slice(0, n)

/**
 * 오늘의 운세. 입력은 빈칸이 뚫린 한 문장이고, 결과는 각주가 달린 한 문단이다.
 * 생년월일만 필수이며, 나머지 빈칸은 채울수록 정확도 눈금이 올라간다.
 */
export function FortuneScreen({
  copy,
  locale,
}: {
  copy: FortuneCopy
  locale: Locale
}) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE)
  const [view, setView] = useState<'input' | 'result'>('input')
  const [fortune, setFortune] = useState<Fortune | null>(null)
  /* 화면이 바뀌면 초점을 새 화면의 시작점으로 옮긴다 */
  useEffect(() => {
    const target =
      view === 'result'
        ? document.querySelector<HTMLElement>('[data-fortune-answer]')
        : (document.querySelector<HTMLElement>(
            '[data-fortune-blank]:placeholder-shown'
          ) ?? document.querySelector<HTMLElement>('[data-fortune-blank]'))
    target?.focus({ preventScroll: view === 'result' })
  }, [view])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!dateValid(profile)) return
    setFortune(makeFortune(profile))
    setView('result')
  }

  if (view === 'result' && fortune) {
    return (
      <FortuneResult
        copy={copy}
        locale={locale}
        profile={profile}
        fortune={fortune}
        onEdit={() => setView('input')}
      />
    )
  }

  return (
    <FortuneForm
      copy={copy}
      locale={locale}
      profile={profile}
      onChange={setProfile}
      onSubmit={submit}
    />
  )
}

/* ─── 입력 ─────────────────────────────────────────────────── */

function FortuneForm({
  copy,
  locale,
  profile: p,
  onChange,
  onSubmit,
}: {
  copy: FortuneCopy
  locale: Locale
  profile: Profile
  onChange: (p: Profile) => void
  onSubmit: (e: FormEvent) => void
}) {
  const reduced = useReducedMotion()
  const sheetRef = useRef<HTMLDivElement>(null)
  const sentenceRef = useRef<HTMLParagraphElement>(null)
  const inputs = useRef<Partial<Record<PartKey, HTMLInputElement>>>({})
  const [menu, setMenu] = useState<PickKey | null>(null)

  const acc = accuracy(p)
  const valid = dateValid(p)

  const set = (patch: Partial<Profile>) => onChange({ ...p, ...patch })
  const focus = (key: PartKey) => inputs.current[key]?.focus()

  /* 년 칸에 8자리를 이어 치거나 붙여넣으면 년·월·일로 나눠 담는다. */
  const onYear = (raw: string) => {
    const d = raw.replace(/\D/g, '')
    if (d.length > 4) {
      const next = {
        year: d.slice(0, 4),
        month: d.slice(4, 6),
        day: d.slice(6, 8),
      }
      set(next)
      focus(
        next.day.length === 2
          ? 'time'
          : next.month.length === 2
            ? 'day'
            : 'month'
      )
      return
    }
    set({ year: d })
    if (d.length === 4) focus('month')
  }
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const d = e.clipboardData.getData('text').replace(/\D/g, '')
    if (d.length < 8) return
    e.preventDefault()
    onYear(d.slice(0, 8))
  }
  const onText = (key: PartKey, raw: string) => {
    switch (key) {
      case 'year':
        return onYear(raw)
      case 'month': {
        const v = digits(raw, 2)
        set({ month: v })
        if (v.length === 2 || +v > 1) focus('day')
        return
      }
      case 'day':
        return set({ day: digits(raw, 2) })
      case 'time': {
        const d = digits(raw, 4)
        return set({
          time: d.length > 2 ? `${d.slice(0, d.length - 2)}:${d.slice(-2)}` : d,
        })
      }
      default:
        return set({ [key]: raw })
    }
  }
  /* Enter: 날짜가 아직이면 다음 빈칸으로, 다 됐으면 폼이 제출된다. */
  const onKey = (key: PartKey, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || valid) return
    e.preventDefault()
    const order: PartKey[] = ['year', 'month', 'day', 'time', 'name']
    const next = order
      .slice(order.indexOf(key) + 1)
      .find((k) => !partOk(p, k) && inputs.current[k])
    if (next) focus(next)
  }
  /* 한 자리 달·날은 칸을 떠날 때 0을 붙인다. */
  const onBlur = (key: PartKey) => {
    if ((key === 'month' || key === 'day') && /^[1-9]$/.test(p[key]))
      set({ [key]: `0${p[key]}` })
  }

  /* 괘선을 문장의 줄 상자에 맞춘다. */
  useLayoutEffect(() => {
    const sheet = sheetRef.current
    const sentence = sentenceRef.current
    if (!sheet || !sentence) return
    const rule = () => {
      const lh = parseFloat(getComputedStyle(sentence).lineHeight)
      if (!lh) return
      sheet.style.setProperty('--lh', `${lh}px`)
      sheet.style.setProperty('--rule-y', `${sentence.offsetTop % lh}px`)
    }
    const ro = new ResizeObserver(rule)
    ro.observe(sheet)
    ro.observe(sentence)
    return () => ro.disconnect()
  }, [])

  /* 바깥을 누르거나 Esc를 치면 메뉴가 닫힌다. */
  useEffect(() => {
    if (!menu) return
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element
      if (!el.closest('[data-menu]') && !el.closest(`[data-pick="${menu}"]`))
        setMenu(null)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMenu(null)
      document.querySelector<HTMLElement>(`[data-pick="${menu}"]`)?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  const missing = PARTS.filter((x) => !partOk(p, x.key)).sort(
    (a, b) => b.weight - a.weight
  )[0]

  /* 미리보기 한 줄 */
  const preview = useMemo(() => {
    if (!partOk(p, 'year')) return copy.preview.empty
    const parts = [
      fill(copy.preview.born, {
        year: p.year,
        zodiac: copy.zodiac[zodiacIndex(+p.year)],
      }),
    ]
    if (partOk(p, 'month') && partOk(p, 'day'))
      parts.push(copy.signs[signIndex(+p.month, +p.day)])
    if (timeValid(p))
      parts.push(
        fill(copy.preview.bornAt, {
          time: hourLabel(copy, +p.time.split(':')[0]),
        })
      )
    if (!dateValid(p)) return `${parts.join(' · ')} …`
    const f = makeFortune(p)
    return fill(copy.preview.line, {
      parts: parts.join(' · '),
      who: p.name.trim() ? fill(copy.who, { name: p.name.trim() }) : '',
      headline:
        copy.content.headlines[f.headline % copy.content.headlines.length],
    })
  }, [copy, p])

  /* 문장 템플릿을 빈칸과 글로 나눈다. 빈칸 뒤에 붙는 말은 함께 묶어 줄이 갈리지 않게 한다. */
  const segments = (() => {
    const out: ReactNode[] = []
    const re = /\{(\w+)\}([^\s{]*)/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(copy.sentence))) {
      if (m.index > last) out.push(copy.sentence.slice(last, m.index))
      const key = m[1] as PartKey
      out.push(
        <span key={key} className="whitespace-nowrap">
          <Blank
            copy={copy}
            profile={p}
            partKey={key}
            ok={partOk(p, key)}
            menuOpen={menu === key}
            inputRef={(el) => {
              if (el) inputs.current[key] = el
            }}
            onText={(v) => onText(key, v)}
            onBlur={() => onBlur(key)}
            onKey={(e) => onKey(key, e)}
            onPaste={key === 'year' ? onPaste : undefined}
            onPick={() =>
              setMenu((cur) => (cur === key ? null : (key as PickKey)))
            }
            reduced={reduced}
          />
          {m[2]}
        </span>
      )
      last = m.index + m[0].length
    }
    if (last < copy.sentence.length) out.push(copy.sentence.slice(last))
    return out
  })()

  return (
    <form
      className="flex flex-1 animate-rise-in flex-col motion-reduce:animate-none"
      noValidate
      autoComplete="off"
      onSubmit={onSubmit}
    >
      <Meter copy={copy} acc={acc} missing={missing?.key} reduced={reduced} />

      <div
        ref={sheetRef}
        className="relative flex flex-1 flex-col justify-center gap-7 px-5 pt-10 pb-7 sm:px-7 sm:pt-14 sm:pb-9 lg:px-[clamp(28px,6vw,104px)] lg:pt-12 lg:pb-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0 calc(var(--lh, 60px) - 1px), rgb(255 255 255 / 0.045) calc(var(--lh, 60px) - 1px) var(--lh, 60px))',
          backgroundPosition: '0 var(--rule-y, 0px)',
        }}
      >
        <p
          ref={sentenceRef}
          lang={locale}
          className="relative max-w-[23em] text-[clamp(24px,4.6vw+6px,58px)] leading-[1.8] font-bold tracking-[-0.035em] break-keep text-ink-2"
        >
          {segments}
        </p>

        {menu && (
          <PickMenu
            copy={copy}
            pickKey={menu}
            value={p[menu]}
            sheet={sheetRef}
            onChoose={(v) => {
              set({ [menu]: v })
              setMenu(null)
              sheetRef.current
                ?.querySelector<HTMLElement>(`[data-pick="${menu}"]`)
                ?.focus()
            }}
          />
        )}

        <p
          className={`flex max-w-[44em] items-baseline gap-3.5 self-start bg-tile py-1.5 pr-3 text-base leading-[1.55] text-ink-2 ${
            valid ? '[&_output]:text-ink' : ''
          }`}
        >
          <span className="shrink-0 font-mono text-xs font-medium tracking-[0.12em] text-ink-3">
            {copy.preview.label}
          </span>
          <Preview text={preview} reduced={reduced} />
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-4 sm:px-7 sm:py-[18px]">
        <p className="text-sm leading-[1.5] break-keep text-ink-3">
          {p.year.length === 4 && p.month && p.day && !valid
            ? copy.hintInvalid
            : copy.hint}
        </p>
        <button
          type="submit"
          disabled={!valid}
          className="inline-flex h-11 shrink-0 items-center gap-2.5 bg-ink px-[18px] text-sm font-bold whitespace-nowrap text-canvas transition-transform duration-150 ease-out-soft outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid active:scale-[0.985] disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {copy.go}
          <span aria-hidden="true" className="font-mono text-xs opacity-70">
            ↵
          </span>
        </button>
      </div>
    </form>
  )
}

/** 정확도 눈금 50개(2%씩). 키보드가 올라와도 보이도록 위에 붙는다. */
function Meter({
  copy,
  acc,
  missing,
  reduced,
}: {
  copy: FortuneCopy
  acc: number
  missing?: PartKey
  reduced: boolean
}) {
  const lit = acc / 2
  const lastLit = useRef(0)
  const [flashFrom, setFlashFrom] = useState<number | null>(null)
  useEffect(() => {
    const from = lastLit.current
    lastLit.current = lit
    if (lit <= from || reduced) return
    setFlashFrom(from)
    const t = setTimeout(() => setFlashFrom(null), 60 + (lit - from) * 18)
    return () => clearTimeout(t)
  }, [lit, reduced])

  return (
    <div className="sticky top-0 z-[5] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border-b border-line bg-tile px-5 py-3.5 sm:px-7 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-x-7">
      <span
        aria-hidden="true"
        className="flex h-3.5 max-w-[440px] items-end justify-between"
      >
        {Array.from({ length: 50 }, (_, i) => {
          const on = i < lit
          const flash = flashFrom !== null && on && i >= flashFrom
          return (
            <i
              key={i}
              className={[
                'w-0.5 transition-[background-color,height] duration-300 ease-out-soft motion-reduce:transition-none',
                i % 5 === 4 ? 'h-3.5' : 'h-[9px]',
                flash
                  ? 'bg-brand-hi transition-none'
                  : on
                    ? 'bg-ink-2'
                    : i === lit && acc < 100
                      ? 'animate-breathe bg-line-strong motion-reduce:animate-none'
                      : 'bg-line-strong',
              ].join(' ')}
            />
          )
        })}
      </span>
      <span
        role="status"
        aria-label={copy.meter.accuracy}
        className="flex items-baseline gap-2 font-mono text-xl font-medium tracking-[-0.02em] tabular-nums"
      >
        <span className="text-[11px] tracking-[0.12em] text-ink-3 uppercase">
          {copy.meter.accuracy}
        </span>
        <Tween value={acc} />
        <small className="text-xs text-ink-3">%</small>
      </span>
      <span className="hidden text-[13px] font-semibold whitespace-nowrap text-ink-3 lg:block">
        {missing ? (
          <>
            {fill(copy.meter.next, { label: copy.parts[missing] })}
            <b className="ml-1.5 font-mono text-xs font-medium text-ink-2">
              +{PARTS.find((x) => x.key === missing)?.weight}
            </b>
          </>
        ) : (
          copy.meter.allFilled
        )}
      </span>
    </div>
  )
}

/** 숫자가 굴러가며 바뀐다. */
export function Tween({ value, ms = 420 }: { value: number; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useRef(0)
  const reduced = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = shown.current
    if (reduced || ms === 0 || from === value) {
      shown.current = value
      el.textContent = String(value)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      shown.current = Math.round(from + (value - from) * e)
      el.textContent = String(shown.current)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, ms, reduced])
  return <span ref={ref}>{reduced ? value : 0}</span>
}

/** 미리보기: 바뀐 글자가 잠깐 섞였다가 자리를 잡는다. */
function Preview({ text, reduced }: { text: string; reduced: boolean }) {
  const ref = useRef<HTMLOutputElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      el.textContent = text
      return
    }
    const pool = '가나다라마바사아자차카타파하0123456789'
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 360)
      const n = Math.floor(text.length * k)
      el.textContent =
        text.slice(0, n) +
        [...text.slice(n)]
          .map((c) =>
            c === ' ' ? ' ' : pool[Math.floor(Math.random() * pool.length)]
          )
          .join('')
      if (k < 1) raf = requestAnimationFrame(step)
      else el.textContent = text
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [text, reduced])
  return (
    <output ref={ref} aria-live="polite" className="break-keep">
      {text}
    </output>
  )
}

/** 문장 속 빈칸 하나. 글 칸이거나(년·월·일·시각·이름) 고르는 칸이다(양음력·성별). */
function Blank({
  copy,
  profile: p,
  partKey: key,
  ok,
  menuOpen,
  inputRef,
  onText,
  onBlur,
  onKey,
  onPaste,
  onPick,
  reduced,
}: {
  copy: FortuneCopy
  profile: Profile
  partKey: PartKey
  ok: boolean
  menuOpen: boolean
  inputRef: (el: HTMLInputElement | null) => void
  onText: (v: string) => void
  onBlur: () => void
  onKey: (e: KeyboardEvent<HTMLInputElement>) => void
  onPaste?: (e: ClipboardEvent<HTMLInputElement>) => void
  onPick: () => void
  reduced: boolean
}) {
  const weight = PARTS.find((x) => x.key === key)!.weight
  const optional = key !== 'year' && key !== 'month' && key !== 'day'
  const wasOk = useRef(ok)
  const [gain, setGain] = useState(false)
  useEffect(() => {
    const before = wasOk.current
    wasOk.current = ok
    if (!ok || before || reduced) return
    setGain(true)
    const t = setTimeout(() => setGain(false), 700)
    return () => clearTimeout(t)
  }, [ok, reduced])

  const localRef = useRef<HTMLInputElement | null>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const value = p[key]
  useLayoutEffect(() => {
    const input = localRef.current
    const measure = measureRef.current
    if (!input || !measure) return
    const size = () => {
      input.style.width = `calc(${Math.ceil(measure.getBoundingClientRect().width)}px + 0.1em + 2px)`
    }
    size()
    document.fonts.ready.then(size)
    const ro = new ResizeObserver(size)
    ro.observe(measure)
    return () => ro.disconnect()
  }, [value])

  const underline = [
    'inline-block min-w-[1.4em] px-[0.05em] text-center leading-[1.25] font-[750] text-ink outline-none',
    'border-b-2 transition-colors duration-200 motion-reduce:transition-none',
    ok
      ? 'border-solid border-line-strong'
      : optional
        ? 'border-dashed border-white/22'
        : 'border-solid border-ink-3',
    'focus:border-solid focus:border-ink',
  ].join(' ')

  const mark = (
    <span
      aria-hidden="true"
      className={`absolute bottom-full left-1/2 mb-px -translate-x-1/2 font-mono text-[10px] leading-none font-medium tracking-[0.06em] whitespace-nowrap transition-colors duration-700 ${
        gain
          ? 'text-brand-hi transition-none'
          : ok
            ? 'text-ink-2'
            : 'text-ink-3'
      }`}
    >
      +{weight}
    </span>
  )

  if (isPick(key)) {
    const value = p[key]
    const label = value
      ? (copy.options[key] as Record<string, string>)[value]
      : ''
    return (
      <span className="relative mx-[0.06em] inline-block leading-[1.25]">
        {mark}
        <button
          type="button"
          data-pick={key}
          aria-haspopup="true"
          aria-expanded={menuOpen}
          aria-label={`${copy.blanks[key].label}: ${label || copy.empty}`}
          onClick={onPick}
          className={`${underline} ${label ? '' : 'text-ink-3'} ${
            menuOpen ? 'border-solid! border-ink!' : ''
          }`}
        >
          {label || copy.blanks[key].placeholder}
        </button>
      </span>
    )
  }

  const { label, placeholder } = copy.blanks[key]
  const numeric = TEXT_KEYS.includes(key) && key !== 'name'
  return (
    <span className="relative mx-[0.06em] inline-block leading-[1.25]">
      {mark}
      {/* 너비는 같은 칸에 겹쳐 둔 보이지 않는 글의 너비를 따른다 */}
      {/* 너비는 같은 글을 보이지 않게 써 둔 자의 너비를 따른다 */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="invisible absolute px-[0.05em] font-[750] whitespace-pre"
      >
        {p[key] || placeholder}
      </span>
      <input
        ref={(el) => {
          localRef.current = el
          inputRef(el)
        }}
        value={p[key]}
        onChange={(e) => onText(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKey}
        onPaste={onPaste}
        data-fortune-blank
        size={1}
        inputMode={numeric ? 'numeric' : undefined}
        maxLength={
          key === 'year' ? 8 : key === 'time' ? 5 : key === 'name' ? 8 : 2
        }
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint={key === 'name' ? 'done' : 'next'}
        className={`${underline} bg-transparent placeholder:text-ink-3`}
      />
    </span>
  )
}

/** 고르는 빈칸 아래 열리는 작은 사각 메뉴. */
function PickMenu({
  copy,
  pickKey,
  value,
  sheet,
  onChoose,
}: {
  copy: FortuneCopy
  pickKey: PickKey
  value: string
  sheet: RefObject<HTMLDivElement | null>
  onChoose: (v: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<CSSProperties>({ visibility: 'hidden' })
  useLayoutEffect(() => {
    const place = () => {
      const el = ref.current
      const anchor = sheet.current?.querySelector<HTMLElement>(
        `[data-pick="${pickKey}"]`
      )
      if (!el || !anchor || !sheet.current) return
      const a = anchor.getBoundingClientRect()
      const s = sheet.current.getBoundingClientRect()
      const left = Math.max(
        8,
        Math.min(a.left - s.left, s.width - el.offsetWidth - 8)
      )
      setPos({ left, top: a.bottom - s.top + 8 })
    }
    place()
    ;(
      (ref.current?.querySelector(
        '[aria-pressed="true"]'
      ) as HTMLElement | null) ?? ref.current?.querySelector('button')
    )?.focus()
    addEventListener('resize', place)
    return () => removeEventListener('resize', place)
  }, [pickKey, sheet])

  const options = Object.entries(
    copy.options[pickKey] as Record<string, string>
  )
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(ref.current?.querySelectorAll('button') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
      items[(i + 1) % items.length]?.focus()
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
      items[(i - 1 + items.length) % items.length]?.focus()
    else return
    e.preventDefault()
  }
  const item =
    'h-[42px] px-[15px] text-[15px] font-bold transition-[color,transform] duration-150 ease-out-soft outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 lit:text-ink [&+button]:shadow-[inset_1px_0_var(--color-line)]'
  return (
    <div
      ref={ref}
      data-menu
      role="group"
      aria-label={copy.blanks[pickKey].label}
      onKeyDown={onKey}
      style={pos}
      className="absolute z-10 flex max-w-[calc(100%-16px)] animate-menu-in flex-wrap border border-line-strong bg-canvas motion-reduce:animate-none"
    >
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChoose(v)}
          className={`${item} ${value === v ? 'bg-ink text-canvas' : 'text-ink-2'}`}
        >
          {label}
        </button>
      ))}
      {value && (
        <button
          type="button"
          onClick={() => onChoose('')}
          className={`${item} text-[13px] text-ink-3`}
        >
          {copy.clear}
        </button>
      )}
    </div>
  )
}
