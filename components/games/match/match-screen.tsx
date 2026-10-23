'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { MatchAnalyzing } from '@/components/games/match/match-analyzing'
import { MatchResult } from '@/components/games/match/match-result'
import {
  andParticle,
  compose,
  rich,
  type MatchCopy,
} from '@/components/games/match/shared'
import type { Locale } from '@/lib/i18n'
import {
  MAX_HANGUL,
  MAX_LATIN,
  nameMatch,
  type NameMatch,
} from '@/lib/name-match'
import { latinName } from '@/lib/name-match/loves'
import { BASE_STROKES, hangulName } from '@/lib/name-match/strokes'

type Names = { a: string; b: string }
type View = 'input' | 'analyzing' | 'result'

/** 이름 하나가 그 자체로 계산할 수 있는 글자인지(한글 다섯 자, 로마자 마흔 자까지) */
const usable = (name: string) => {
  const h = hangulName(name)
  if (h) return h.length <= MAX_HANGUL
  const l = latinName(name)
  return !!l && l.length <= MAX_LATIN
}

/**
 * 이름 궁합. 입력은 빈칸 두 개짜리 문장이고, 궁합 보기를 누르면 실제 계산
 * (번갈아 쓰기 → 획수 → 피라미드)을 한 줄씩 보여 준 뒤 결과로 넘어간다.
 * 계산 방식은 입력한 글자로 정해진다(한글은 획수, 로마자는 LOVES 놀이).
 */
export function MatchScreen({
  copy,
  locale,
}: {
  copy: MatchCopy
  locale: Locale
}) {
  const [names, setNames] = useState<Names>({ a: '', b: '' })
  const [view, setView] = useState<View>('input')
  const [match, setMatch] = useState<NameMatch | null>(null)

  /* 화면이 바뀌면 초점을 새 화면의 시작점으로 옮긴다 */
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const target = document.querySelector<HTMLElement>(
      view === 'result'
        ? '[data-match-answer]'
        : view === 'analyzing'
          ? '[data-match-skip]'
          : '[data-match-blank]'
    )
    target?.focus({ preventScroll: view !== 'input' })
  }, [view])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const m = nameMatch(names.a, names.b)
    if ('error' in m) return
    setMatch(m)
    setView('analyzing')
  }
  const showResult = useCallback(() => setView('result'), [])

  if (view === 'analyzing' && match)
    return <MatchAnalyzing copy={copy} match={match} onDone={showResult} />

  if (view === 'result' && match)
    return (
      <MatchResult
        copy={copy}
        match={match}
        onEdit={() => setView('input')}
        onAgain={() => {
          setNames({ a: '', b: '' })
          setView('input')
        }}
      />
    )

  return (
    <MatchForm
      copy={copy}
      locale={locale}
      names={names}
      onChange={setNames}
      onSubmit={submit}
    />
  )
}

/* ─── 입력 ─────────────────────────────────────────────────── */

function MatchForm({
  copy,
  locale,
  names,
  onChange,
  onSubmit,
}: {
  copy: MatchCopy
  locale: Locale
  names: Names
  onChange: (n: Names) => void
  onSubmit: (e: FormEvent) => void
}) {
  /* 한글을 조합하는 동안(ㄱ → 기 → 김)에는 덜 된 글자로 오류를 띄우지 않는다 */
  const [composing, setComposing] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const bInput = useRef<HTMLInputElement>(null)

  const m = nameMatch(names.a, names.b)
  const error =
    'error' in m && m.error !== 'empty' && !composing ? m.error : null
  const kind = 'error' in m ? 'none' : m.kind
  /* 빈칸 밑줄: 혼자서도 계산할 수 없는 글자거나, 두 이름의 글자 종류가 다르면 경고색 */
  const blankState = (value: string) =>
    !value.trim() || composing
      ? 'idle'
      : !usable(value) || error === 'mixed'
        ? 'bad'
        : 'ok'

  /* 바깥을 누르거나 Esc를 치면 계산 규칙 창이 닫힌다 */
  useEffect(() => {
    if (!rulesOpen) return
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-match-band]'))
        setRulesOpen(false)
    }
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' && setRulesOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [rulesOpen])

  const blank = (key: keyof Names) => (
    <Blank
      key={key}
      value={names[key]}
      placeholder={copy.blanks[key]}
      state={blankState(names[key])}
      inputRef={key === 'b' ? bInput : undefined}
      enterKeyHint={key === 'a' ? 'next' : 'go'}
      onChange={(v) => onChange({ ...names, [key]: v })}
      onComposing={setComposing}
      onEnter={
        key === 'a'
          ? (e) => {
              e.preventDefault()
              bInput.current?.focus()
            }
          : undefined
      }
    />
  )
  const sentence = compose(copy.sentence, {
    a: blank('a'),
    b: blank('b'),
    and: andParticle(copy, names.a.trim()),
    loves: (
      <span className="font-mono text-[0.72em] font-medium tracking-[0.08em] text-brand-hi">
        LOVES
      </span>
    ),
  })

  const hint = error
    ? copy.hint[error]
    : kind === 'none'
      ? copy.hint.idle
      : copy.hint[kind]

  return (
    <form
      className="flex flex-1 animate-rise-in flex-col motion-reduce:animate-none"
      noValidate
      autoComplete="off"
      onSubmit={onSubmit}
    >
      <div
        data-match-band
        className="relative flex items-center gap-x-4 border-b border-line px-5 py-3.5 sm:px-7"
      >
        <p className="flex min-w-0 items-baseline gap-3">
          <span className="font-mono text-[11px] tracking-[0.12em] whitespace-nowrap text-ink-3 uppercase">
            {copy.method.label}
          </span>
          <b className="text-[15px] font-[750] tracking-[-0.02em] whitespace-nowrap">
            {copy.method[kind].name}
          </b>
          <span className="truncate text-[13px] text-ink-3">
            {copy.method[kind].how}
          </span>
        </p>
        <button
          type="button"
          aria-expanded={rulesOpen}
          aria-controls="match-rules"
          onClick={() => setRulesOpen((o) => !o)}
          className="ml-auto shrink-0 text-[13px] font-bold whitespace-nowrap text-ink-2 transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid lit:text-ink"
        >
          {copy.rules.button}
        </button>
        {rulesOpen && <Rules copy={copy} loves={kind === 'loves'} />}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-7 px-5 pt-10 pb-7 sm:px-7 sm:pt-14 sm:pb-9 lg:px-[clamp(28px,6vw,104px)] lg:pt-12 lg:pb-10">
        <p
          lang={locale}
          className="max-w-[22em] text-[clamp(26px,4.6vw+6px,60px)] leading-[1.7] font-bold tracking-[-0.035em] break-keep text-ink-2"
        >
          {sentence}
        </p>
        <div
          aria-live="polite"
          className="flex min-h-[58px] flex-wrap items-center gap-x-3.5 gap-y-2.5"
        >
          <span className="shrink-0 font-mono text-xs font-medium tracking-[0.12em] text-ink-3 uppercase">
            {copy.preview.label}
          </span>
          <Tape copy={copy} match={m} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-4 sm:px-7 sm:py-[18px]">
        <p
          className={`text-sm leading-[1.5] break-keep ${error ? 'text-warn' : 'text-ink-3'}`}
        >
          {hint}
        </p>
        <button
          type="submit"
          disabled={kind === 'none'}
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

/**
 * 문장 속 이름 빈칸. 너비는 같은 칸에 겹쳐 둔 보이지 않는 글이 정해서, 이름이
 * 길어지면 칸도 함께 늘어난다. 칸은 리렌더해도 새로 만들어지지 않아 한글 조합이
 * 끊기지 않는다.
 */
function Blank({
  value,
  placeholder,
  state,
  inputRef,
  enterKeyHint,
  onChange,
  onComposing,
  onEnter,
}: {
  value: string
  placeholder: string
  state: 'idle' | 'ok' | 'bad'
  inputRef?: Ref<HTMLInputElement>
  enterKeyHint: 'next' | 'go'
  onChange: (v: string) => void
  onComposing: (on: boolean) => void
  onEnter?: (e: ReactKeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <span className="mx-[0.02em] inline-grid leading-[1.25]">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onCompositionStart={() => onComposing(true)}
        onCompositionEnd={() => onComposing(false)}
        onKeyDown={(e) => {
          /* 조합을 확정하는 Enter는 건드리지 않는다 */
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) onEnter?.(e)
        }}
        data-match-blank
        size={1}
        maxLength={40}
        spellCheck={false}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-invalid={state === 'bad'}
        enterKeyHint={enterKeyHint}
        className={`col-start-1 row-start-1 w-0 min-w-full border-b-2 bg-transparent px-[0.05em] text-center font-[750] text-ink transition-colors duration-200 outline-none placeholder:text-ink-3 focus:border-ink motion-reduce:transition-none ${
          state === 'bad'
            ? 'border-warn'
            : state === 'ok'
              ? 'border-line-strong'
              : 'border-ink-3'
        }`}
      />
      <span
        aria-hidden="true"
        className="invisible col-start-1 row-start-1 min-w-[1.6em] ps-[0.05em] pe-[calc(0.05em+2px)] font-[750] whitespace-pre"
      >
        {value || placeholder}
      </span>
    </span>
  )
}

/** 미리보기: 번갈아 놓인 글자와 획수, 또는 L·O·V·E·S 개수 */
function Tape({
  copy,
  match: m,
}: {
  copy: MatchCopy
  match: ReturnType<typeof nameMatch>
}) {
  const cells: [ReactNode, number, boolean][] =
    'error' in m
      ? []
      : m.kind === 'strokes'
        ? m.readings[0].letters.map((ch, i) => [
            ch,
            m.readings[0].rows[0][i],
            m.readings[0].owners[i] === 1,
          ])
        : [...'LOVES'].map((ch, i) => [ch, m.reading.counts[i], false])
  if (!cells.length)
    return (
      <p className="text-[15px] leading-[1.55] text-ink-3">
        {copy.preview.idle}
      </p>
    )
  return (
    <div className="flex flex-wrap gap-1">
      {cells.map(([ch, n, dim], i) => (
        <span
          key={i}
          className={`grid min-w-[38px] animate-menu-in justify-items-center border border-line px-1.5 pt-[5px] pb-1 text-[17px] font-[750] motion-reduce:animate-none ${
            dim ? 'text-ink-2' : 'text-ink'
          }`}
        >
          {ch}
          <small className="font-mono text-xs font-medium text-ink-3">
            {n}
          </small>
        </span>
      ))}
    </div>
  )
}

/** 계산 규칙 창: 획수표(또는 LOVES 규칙)와 재현성·개인정보 안내 */
function Rules({ copy, loves }: { copy: MatchCopy; loves: boolean }) {
  const all = Object.entries(BASE_STROKES)
  const grid = (list: [string, number][], label: string) => (
    <div className="grid grid-cols-7 gap-1">
      <p className="col-span-full font-mono text-[11px] tracking-[0.12em] text-ink-3">
        {label}
      </p>
      {list.map(([j, n]) => (
        <span
          key={j}
          className="grid justify-items-center gap-0.5 border border-line pt-1.5 pb-[5px] text-base font-bold"
        >
          {j}
          <small className="font-mono text-[11px] font-medium text-ink-3">
            {n}
          </small>
        </span>
      ))}
    </div>
  )
  return (
    <div
      id="match-rules"
      className="absolute inset-x-3 top-[calc(100%-1px)] z-10 ml-auto grid max-w-[560px] animate-menu-in gap-3.5 border border-line-strong bg-canvas px-5 pt-[18px] pb-5 text-[13.5px] leading-[1.6] break-keep text-ink-2 motion-reduce:animate-none sm:right-7"
    >
      <p>{rich(loves ? copy.rules.loves : copy.rules.strokes)}</p>
      {!loves && (
        <div aria-label={copy.rules.table} className="grid gap-2.5">
          {grid(all.slice(0, 14), copy.rules.consonants)}
          {grid(all.slice(14), copy.rules.vowels)}
        </div>
      )}
      <p>{copy.rules.common}</p>
    </div>
  )
}
