'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  useEffect,
  useRef,
  ViewTransition,
  type ViewTransitionInstance,
} from 'react'
import { LOCALES, LOCALE_COOKIE, type Locale } from '@/lib/i18n'
import { LOCALE_COIN_TRANSITION, NAV_LOCALE, toLocale } from '@/lib/transitions'

const ONE_YEAR = 60 * 60 * 24 * 365

const COIN_SHARE = { [NAV_LOCALE]: 'coin', default: 'none' }

type Target = { locale: Locale; href: string }

/**
 * 진행 중인 언어 전환. 한 번에 하나만 돌린다. 전환이 도는 동안 다시 누르면
 * 이동을 바로 시작하지 않고 마지막으로 누른 것만 `next`에 두었다가, 새 언어
 * 페이지가 자리 잡으면 이어서 바꾼다(`LocaleSwitch`의 이펙트). 겹쳐 시작하면 뒤
 * 이동의 커밋이 앞 전환이 끝날 때까지 밀리고, 그사이 요청이 끼면(프리페치 전,
 * 개발 서버) 전환 타입이 사라져 언어 전환 대신 페이지 간 모프가 나온다.
 * 이동이 끝내 자리 잡지 못해도 막히지 않게 `SETTLE_LIMIT`가 지나면 풀어 준다.
 * `chips`는 전환을 시작할 때 잰 칩 자리다(`catchStrayClick`).
 */
const SETTLE_LIMIT = 5000
const switching: {
  since: number
  next: Target | null
  chips: (Target & { rect: DOMRect })[]
} = { since: -Infinity, next: null, chips: [] }
const isSwitching = () => performance.now() - switching.since < SETTLE_LIMIT

const typesFor = (locale: Locale) => [NAV_LOCALE, toLocale(locale)]

const rememberLocale = (locale: Locale) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}

/**
 * 브라우저는 전환 스냅샷을 뜨는 동안(전환 시작부터 애니메이션 준비까지) 클릭을
 * 칩이 아니라 `<html>`로 보낸다. 그 사이에 누른 칩을 놓치지 않게, 전환을 시작할
 * 때 잰 칩 자리로 클릭을 돌려준다. 칩은 전환 중에 자리를 옮기지 않는다.
 */
function catchStrayClick(e: MouseEvent) {
  if (e.target !== document.documentElement || !isSwitching()) return
  const chip = switching.chips.find(
    ({ rect: r }) =>
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom
  )
  if (!chip) return
  rememberLocale(chip.locale)
  switching.next = { locale: chip.locale, href: chip.href }
}

/** 전환 의사 요소 하나. React가 넘기는 인스턴스에 있지만 타입 정의에는 아직 없다. */
type PseudoElement = {
  animate(keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation
  getAnimations(): Animation[]
}
type CoinInstance = ViewTransitionInstance &
  Record<'group' | 'imagePair' | 'old' | 'new', PseudoElement>

const FLIP_EASING = 'cubic-bezier(0.3, 0.1, 0.4, 1)'
const flip = (from: number, to: number) => [
  { transform: `perspective(240px) rotateX(${from}deg)` },
  { transform: `perspective(240px) rotateX(${to}deg)` },
]

/**
 * 지금 언어 칩(앞면 KO, 뒷면 EN)을 동전처럼 던진다. 그룹은 갈 언어 칸으로 곧게
 * 가고, 그 안에서 이미지 쌍이 포물선으로 튀어 오르며 앞뒷면이 함께 돈다. 반 바퀴
 * 돌며 낮게 갈지 한 바퀴 반 돌며 높게 갈지는 운이다. 모두 transform이라
 * 컴포지터에서 돈다. 동작 줄이기에서는 CSS가 그룹을 바로 옮긴다.
 */
function toss(instance: ViewTransitionInstance, types: string[]) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { group, imagePair, old, new: next } = instance as CoinInstance
  const high = Math.random() < 0.5
  const duration = high ? 460 : 360
  const lift = high ? -22 : -10
  const spin = (high ? 540 : 180) * (types.includes(toLocale('ko')) ? -1 : 1)

  // 칩 너비가 언어마다 조금 달라도 크기는 애니메이션하지 않는다(매 프레임
  // 레이아웃이 든다). 그룹은 처음부터 새 크기이고 자리만 옮겨 간다.
  for (const { effect } of group.getAnimations()) {
    if (!(effect instanceof KeyframeEffect)) continue
    const keyframes = effect.getKeyframes()
    for (const k of keyframes) {
      delete k.width
      delete k.height
    }
    effect.setKeyframes(keyframes)
    effect.updateTiming({ duration })
  }

  const timing = { duration, fill: 'both' } as const
  const animations = [
    imagePair.animate(
      [
        {
          transform: 'translateY(0)',
          easing: 'cubic-bezier(0.3, 0.7, 0.6, 1)',
        },
        {
          transform: `translateY(${lift}px) scale(1.12)`,
          offset: 0.5,
          easing: 'cubic-bezier(0.5, 0, 0.75, 0.3)',
        },
        { transform: 'translateY(0)' },
      ],
      timing
    ),
    old.animate(flip(0, spin), { ...timing, easing: FLIP_EASING }),
    next.animate(flip(-spin, 0), { ...timing, easing: FLIP_EASING }),
  ]
  return () => animations.forEach((a) => a.cancel())
}

/**
 * 언어 칩. 같은 경로의 다른 언어로 클라이언트 이동한다. 페이지는 제자리에 두고
 * 바뀌는 글자만 갈아 끼우며(`LocaleText`), 지금 언어 칩은 동전처럼 뒤집혀 갈
 * 언어 칸에 내려앉는다. 두 언어의 페이지가 같은 커밋에 그려져야 짝이 생기므로
 * 미리 받아 둔다. 스크롤은 그대로 둔다. 빠르게 여러 번 눌러도 전환은 하나씩
 * 차례로 돌고 마지막으로 누른 언어에서 멈춘다(`switching`).
 */
export function LocaleSwitch({
  current,
  labels,
}: {
  current: Locale
  labels: { label: string } & Record<Locale, string>
}) {
  const pathname = usePathname()
  const router = useRouter()
  const nav = useRef<HTMLElement>(null)
  const hrefFor = (locale: Locale) =>
    pathname.replace(/^\/(ko|en)(?=\/|$)/, `/${locale}`) || `/${locale}`
  const measureChips = () =>
    LOCALES.flatMap((locale) => {
      const chip = nav.current?.querySelector(`[hreflang="${locale}"]`)
      return chip
        ? [
            {
              locale,
              href: hrefFor(locale),
              rect: chip.getBoundingClientRect(),
            },
          ]
        : []
    })

  useEffect(() => {
    document.addEventListener('click', catchStrayClick)
    return () => document.removeEventListener('click', catchStrayClick)
  }, [])

  // 이 언어의 페이지가 자리 잡았다. React는 뷰 전환이 끝난 뒤에 이펙트를 돌리지만,
  // 다른 업데이트가 이펙트를 앞당겼을 수 있으니 도는 전환이 있으면 끝까지 기다린다.
  useEffect(() => {
    let live = true
    const { activeViewTransition } = document as {
      activeViewTransition?: { finished: Promise<unknown> } | null
    }
    const settled = activeViewTransition
      ? activeViewTransition.finished.catch(() => {})
      : Promise.resolve()
    settled.then(() => {
      if (!live) return
      const { next } = switching
      switching.next = null
      switching.since = -Infinity
      if (next && next.locale !== current) {
        switching.since = performance.now()
        router.push(next.href, {
          scroll: false,
          transitionTypes: typesFor(next.locale),
        })
      }
    })
    return () => {
      live = false
    }
  }, [current, router])

  return (
    <nav ref={nav} aria-label={labels.label}>
      <ul className="flex items-center border border-line-strong font-mono text-[11px] tracking-[0.12em]">
        {LOCALES.map((locale) => {
          const active = locale === current
          const link = (
            <Link
              href={hrefFor(locale)}
              hrefLang={locale}
              lang={locale}
              prefetch={true}
              scroll={false}
              transitionTypes={typesFor(locale)}
              aria-label={labels[locale]}
              aria-current={active ? 'true' : undefined}
              onClick={() => rememberLocale(locale)}
              onNavigate={(e) => {
                if (isSwitching()) {
                  // 전환 중: 마지막으로 누른 언어만 기억했다가 끝나면 이어서 바꾼다
                  e.preventDefault()
                  switching.next = { href: hrefFor(locale), locale }
                } else if (active) {
                  // 지금 언어는 다시 그릴 것이 없다
                  e.preventDefault()
                } else {
                  switching.since = performance.now()
                  switching.chips = measureChips()
                }
              }}
              className={`flex h-6 min-w-8 items-center justify-center px-2 uppercase transition-[color,scale] duration-150 ease-out-soft outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid active:scale-[0.92] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                active ? 'bg-ink text-canvas' : 'text-ink-3 lit:text-ink'
              }`}
            >
              {locale}
            </Link>
          )
          return (
            <li key={locale}>
              {active ? (
                <ViewTransition
                  name={LOCALE_COIN_TRANSITION}
                  share={COIN_SHARE}
                  default="none"
                  onShare={toss}
                >
                  {link}
                </ViewTransition>
              ) : (
                link
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
