/**
 * 밤하늘 엔진. 별 45개, 별을 잇는 선, 빛 효과(캔버스), 배경 하늘(캔버스)을 직접 그린다.
 * 화면 글자와 상태는 React가 갖고, 이 엔진은 그림과 시간만 맡는다.
 * 별 자리는 결정적이라 누구에게나 같은 하늘이다.
 */

import { ballTone, cellElement, type Orbit } from '@/lib/lotto'
import type { Game } from '@/lib/lotto/random'
import { s } from './sky-classes'
import './sky.css'

const NS = 'http://www.w3.org/2000/svg'
const TOTAL = 45

/* ── 하늘: 별 45개의 자리 ──────────────────────────────────────
   결정적 의사난수로 흩뿌리되(은하수 띠 쪽이 조금 더 촘촘하다) 서로 일정 거리 이상 떨어뜨린다.
   가로가 세로의 두 배인 하늘을 기준으로 거리를 재고, 실제 하늘 비율에 맞게 늘인다.
   번호는 가까운 별끼리 잇는 순회로(최근접 + 2-opt, 교차 없음)를 따라 붙인다. 그래서
   1–45 길이 하늘을 구불구불 돈다. */
export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
type Pt = [number, number]
const VA = 2
const vd = (a: Pt, b: Pt) => Math.hypot((a[0] - b[0]) * VA, a[1] - b[1])
/* 은하수 띠: 왼쪽 아래 → 오른쪽 위 */
const bandDist = (x: number, y: number) => {
  const dx = 1
  const dy = -0.8
  const t = (x * dx + (y - 0.9) * dy) / (dx * dx + dy * dy)
  return Math.hypot((x - t * dx) * VA, y - (0.9 + t * dy))
}
function skyPoints(): Pt[] {
  const rnd = mulberry32(2026)
  let dmin = 0.18
  let pts: Pt[] = []
  for (;;) {
    pts = []
    let tries = 0
    while (pts.length < TOTAL && tries < 60000) {
      tries++
      const x = 0.015 + rnd() * 0.97
      const y = 0.02 + rnd() * 0.96
      if (rnd() > 0.45 + 0.55 * Math.exp(-((bandDist(x, y) / 0.32) ** 2)))
        continue
      if (pts.every((p) => vd(p, [x, y]) >= dmin)) pts.push([x, y])
    }
    if (pts.length === TOTAL) break
    dmin *= 0.97
  }
  const n = pts.length
  let first = 0
  pts.forEach((p, i) => {
    if (p[0] < pts[first][0]) first = i
  })
  const used = new Set([first])
  const t = [first]
  while (t.length < n) {
    const last = pts[t[t.length - 1]]
    let best = -1
    let bd = 1e9
    for (let i = 0; i < n; i++)
      if (!used.has(i) && vd(last, pts[i]) < bd) {
        bd = vd(last, pts[i])
        best = i
      }
    used.add(best)
    t.push(best)
  }
  for (let improved = true; improved;) {
    improved = false
    for (let i = 0; i < n - 1; i++)
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue
        const a = pts[t[i]]
        const b = pts[t[i + 1]]
        const c = pts[t[j]]
        const e = pts[t[(j + 1) % n]]
        if (vd(a, c) + vd(b, e) < vd(a, b) + vd(c, e) - 1e-9) {
          t.splice(i + 1, j - i, ...t.slice(i + 1, j + 1).reverse())
          improved = true
        }
      }
  }
  return t.map((i) => pts[i])
}

let layout: {
  X: number[]
  Y: number[]
  size: number[]
  alpha: number[]
} | null = null
/** 별 n(1–45)의 하늘 안 자리(0–1)와 크기·밝기 */
function starLayout() {
  if (layout) return layout
  const X: number[] = []
  const Y: number[] = []
  const size: number[] = []
  const alpha: number[] = []
  skyPoints().forEach(([x, y], i) => {
    X[i + 1] = x
    Y[i + 1] = y
  })
  const r = mulberry32(4545)
  for (let n = 1; n <= TOTAL; n++) {
    size[n] = 2.6 + r() * 2.4
    alpha[n] = 0.62 + r() * 0.36
  }
  layout = { X, Y, size, alpha }
  return layout
}

const svgEl = (tag: string, attrs: Record<string, string>) => {
  const e = document.createElementNS(NS, tag)
  for (const k in attrs) e.setAttribute(k, attrs[k])
  return e
}

/** 그냥 뽑기에서 게임(A–E)을 가르는 색 */
export const GAME_COLORS = [
  '#9dbbff',
  '#ffd37f',
  '#ff9fb4',
  '#8ff0c8',
  '#cfaaff',
]
const GAME_RGB = [
  '157,187,255',
  '255,211,127',
  '255,159,180',
  '143,240,200',
  '207,170,255',
]
/** 로또 공 색의 RGB(빛 효과용) */
const TONE_RGB = {
  yellow: '246,195,59',
  blue: '95,180,239',
  red: '255,107,107',
  gray: '200,200,194',
  green: '143,207,74',
}

type Effect = (now: number) => boolean | void
type Walker = { tick: (now: number) => void; draw: (now: number) => void }

export type WalkEvents = {
  /** k번째 걸음을 시작한다 */
  onMove: (k: number) => void
  /** 기신 칸이나 뽑힌 칸이라 한 칸 더 간다 */
  onSkip: (k: number, cell: number, why: 'gi' | 'taken') => void
  /** 걸음이 끝났다. 번호를 놓은 걸음이면 i는 놓은 순서다 */
  onEnd: (k: number, i: number | null) => void
  onClimax: () => void
  onFinish: () => void
}

export type Mode = 'preview' | 'fortune' | 'random'

export class Sky {
  private host: HTMLElement
  private scene: HTMLElement
  private bg: HTMLElement
  private reduced: () => boolean
  private field: HTMLDivElement
  private stars: HTMLSpanElement[] = []
  private gPreview: SVGGElement
  private gRoute: SVGGElement
  private gConst: SVGGElement
  private gRand: SVGGElement
  private fx: HTMLCanvasElement
  private fxc: CanvasRenderingContext2D
  private bgCanvases: HTMLCanvasElement[] = []
  private FW = 0
  private FH = 0
  private dpr = 1
  private effects: Effect[] = []
  private fxRaf = 0
  private walker: Walker | null = null
  private timers: ReturnType<typeof setTimeout>[] = []
  private observers: ResizeObserver[] = []
  private skyTimer: ReturnType<typeof setTimeout> | undefined
  private ambient: ReturnType<typeof setInterval> | undefined
  private pxRaf = 0
  private amb = mulberry32(7)
  private calm = false
  private onReady: (() => void) | null
  private static FXM = 30

  /** onReady: 첫 배치(크기)가 정해지면 한 번 부른다 */
  constructor(
    host: HTMLElement,
    scene: HTMLElement,
    bg: HTMLElement,
    reduced: () => boolean,
    onReady: () => void
  ) {
    this.onReady = onReady
    this.host = host
    this.scene = scene
    this.bg = bg
    this.reduced = reduced
    const { X, Y, size, alpha } = starLayout()

    /* 하늘 배경 네 층 */
    for (const cls of [s.far, s.twA, s.twB, s.twC]) {
      const c = document.createElement('canvas')
      c.className = cls
      bg.append(c)
      this.bgCanvases.push(c)
    }

    this.field = document.createElement('div')
    this.field.className = s.field
    this.field.dataset.mode = 'preview'
    const back = svgEl('svg', {
      class: s.lines,
      viewBox: '0 0 100 100',
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
    })
    const P = (n: number) =>
      `${(X[n] * 100).toFixed(2)},${(Y[n] * 100).toFixed(2)}`
    back.append(
      svgEl('polygon', {
        class: s.road,
        points: Array.from({ length: TOTAL }, (_, i) => P(i + 1)).join(' '),
      })
    )
    this.gPreview = svgEl('g', { class: s.gPreview }) as SVGGElement
    back.append(this.gPreview)
    const front = svgEl('svg', {
      class: `${s.lines} ${s.glow}`,
      viewBox: '0 0 100 100',
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
    })
    this.gRoute = svgEl('g', { class: s.gRoute }) as SVGGElement
    this.gConst = svgEl('g', { class: s.gConst }) as SVGGElement
    this.gRand = svgEl('g', { class: s.gRand }) as SVGGElement
    front.append(this.gRoute, this.gConst, this.gRand)

    const starBox = document.createElement('div')
    starBox.setAttribute('aria-hidden', 'true')
    for (let n = 1; n <= TOTAL; n++) {
      const star = document.createElement('span')
      star.className = s.star
      star.dataset.n = String(n)
      star.dataset.el = String(cellElement(n))
      star.style.cssText = `--x:${X[n].toFixed(4)};--y:${Y[n].toFixed(4)};--s:${size[n].toFixed(2)}px;--o:${alpha[n].toFixed(2)}`
      star.innerHTML = `<i class="${s.flare}"></i><i class="${s.core}"></i><i class="${s.ring}"></i><b class="${s.lbl}">${n}</b>`
      starBox.append(star)
      this.stars[n] = star
    }
    this.fx = document.createElement('canvas')
    this.fx.className = s.fx
    this.fx.setAttribute('aria-hidden', 'true')
    this.fxc = this.fx.getContext('2d')!
    this.field.append(back, front, starBox, this.fx)
    host.append(this.field)

    const ro = new ResizeObserver(() => this.layoutField())
    ro.observe(this.field)
    const ro2 = new ResizeObserver(() => {
      clearTimeout(this.skyTimer)
      this.skyTimer = setTimeout(() => this.paintSky(), 120)
    })
    ro2.observe(bg)
    this.observers.push(ro, ro2)
    this.paintSky()
    scene.parentElement?.addEventListener('pointermove', this.onPointer)

    /* 하늘이 고요할 때 가끔 별똥별이 지나간다 */
    this.ambient = setInterval(() => {
      if (
        !this.calm ||
        this.reduced() ||
        document.hidden ||
        this.walker ||
        this.effects.length ||
        this.amb() > 0.45
      )
        return
      const x = 0.25 + this.amb() * 0.7
      const y = 0.02 + this.amb() * 0.3
      this.streak([x, y], [x - 0.22, y + 0.38], {
        dur: 900,
        len: 110,
        rgb: '215,228,255',
        alpha: 0.6,
      })
    }, 2600)
  }

  destroy() {
    this.stopWalk()
    this.stopTimers()
    clearInterval(this.ambient)
    clearTimeout(this.skyTimer)
    cancelAnimationFrame(this.pxRaf)
    this.observers.forEach((o) => o.disconnect())
    this.scene.parentElement?.removeEventListener('pointermove', this.onPointer)
    this.field.remove()
    this.bgCanvases.forEach((c) => c.remove())
  }

  /* ── 공통 ──────────────────────────────────────────────── */
  private later(ms: number, fn: () => void) {
    this.timers.push(setTimeout(fn, ms))
  }
  private stopTimers() {
    this.timers.forEach(clearTimeout)
    this.timers = []
  }
  private starsClear(...cls: string[]) {
    for (let n = 1; n <= TOTAL; n++) this.stars[n].classList.remove(...cls)
  }
  private restartClass(el: Element, cls: string, ms: number) {
    el.classList.remove(cls)
    void (el as HTMLElement).offsetWidth
    el.classList.add(cls)
    setTimeout(() => el.classList.remove(cls), ms)
  }

  setMode(mode: Mode) {
    this.field.dataset.mode = mode
  }
  /** 장면이 멈춰 있을 때(안내·결과)만 대기 별똥별을 띄운다 */
  setCalm(calm: boolean) {
    this.calm = calm
    this.field.classList.toggle(s.settled, calm)
  }
  setAriaLabel(label: string) {
    this.field.setAttribute('role', 'img')
    this.field.setAttribute('aria-label', label)
  }
  /** 별의 화면 위치(공이 날아갈 출발점) */
  starRect(n: number) {
    return this.stars[n].querySelector(`.${s.core}`)!.getBoundingClientRect()
  }

  private onPointer = (e: PointerEvent) => {
    if (this.reduced() || e.pointerType !== 'mouse' || this.pxRaf) return
    this.pxRaf = requestAnimationFrame(() => {
      this.pxRaf = 0
      const root = this.scene.parentElement!
      const r = root.getBoundingClientRect()
      root.style.setProperty(
        '--px',
        (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3)
      )
      root.style.setProperty(
        '--py',
        (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3)
      )
    })
  }

  /* ── 선 ────────────────────────────────────────────────── */
  private addLine(
    g: SVGGElement,
    a: number,
    b: number,
    cls: string,
    { ms = 0, attrs = {} }: { ms?: number; attrs?: Record<string, string> } = {}
  ) {
    const { X, Y } = starLayout()
    const line = svgEl('line', {
      x1: (X[a] * 100).toFixed(2),
      y1: (Y[a] * 100).toFixed(2),
      x2: (X[b] * 100).toFixed(2),
      y2: (Y[b] * 100).toFixed(2),
      class: cls,
      ...attrs,
    })
    g.append(line)
    if (ms) this.growPath(line, [a, b], ms)
    return line
  }
  /** 선을 그어 나간다. 대시(pathLength)는 non-scaling-stroke와 함께 쓰면 깨져서 끝점을 직접 늘린다 */
  private growPath(el: SVGElement, pts: number[], ms: number) {
    if (this.reduced()) return
    const { X, Y } = starLayout()
    const xy = pts.map((n) => [X[n] * 100, Y[n] * 100])
    const seg: number[] = []
    let total = 0
    for (let i = 1; i < xy.length; i++) {
      const d = Math.hypot(
        (xy[i][0] - xy[i - 1][0]) * (this.FW || 1),
        (xy[i][1] - xy[i - 1][1]) * (this.FH || 1)
      )
      seg.push(d)
      total += d
    }
    const set = (e: number) => {
      let left = e * total
      const out = [xy[0]]
      for (let i = 1; i < xy.length; i++) {
        if (left >= seg[i - 1]) {
          out.push(xy[i])
          left -= seg[i - 1]
          continue
        }
        const f = seg[i - 1] ? left / seg[i - 1] : 1
        out.push([
          xy[i - 1][0] + (xy[i][0] - xy[i - 1][0]) * f,
          xy[i - 1][1] + (xy[i][1] - xy[i - 1][1]) * f,
        ])
        break
      }
      if (el.tagName === 'line') {
        const [x, y] = out[out.length - 1]
        el.setAttribute('x2', x.toFixed(2))
        el.setAttribute('y2', y.toFixed(2))
      } else
        el.setAttribute(
          'points',
          out.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
        )
    }
    set(0)
    const t0 = performance.now()
    this.effects.push((now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / ms))
      set(1 - (1 - k) ** 3)
      if (k >= 1) return false
    })
    this.fxKick()
  }

  /* ── 크기: 별 번호 자리, 효과 캔버스 ──────────────────────── */
  private layoutField() {
    const { X, Y } = starLayout()
    const FW = this.field.clientWidth
    const FH = this.field.clientHeight
    this.FW = FW
    this.FH = FH
    if (!FW || !FH) return
    const fs = FW >= 760 ? 11 : 10
    this.field.style.setProperty('--lfs', fs + 'px')
    const cw = fs * 0.62
    const lh = Math.ceil(fs * 1.3)
    type R = { l: number; t: number; r: number; b: number }
    const ov = (a: R, b: R) =>
      Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) *
      Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t))
    const placed: R[] = []
    for (let n = 1; n <= TOTAL; n++) {
      const x = X[n] * FW
      const y = Y[n] * FH
      const lw = String(n).length * cw + 2
      const C = [
        [5, -lh - 1],
        [7, -lh / 2],
        [5, 2],
        [-5 - lw, -lh - 1],
        [-7 - lw, -lh / 2],
        [-5 - lw, 2],
        [-lw / 2, -lh - 7],
        [-lw / 2, 7],
      ]
      let best: [number, number, R] | null = null
      let bs = Infinity
      C.forEach(([dx, dy], ci) => {
        const r = { l: x + dx, t: y + dy, r: x + dx + lw, b: y + dy + lh }
        let sc = ci * 0.5
        for (const q of placed) sc += ov(r, q) * 40
        for (let m = 1; m <= TOTAL; m++) {
          if (m === n) continue
          const cx = X[m] * FW
          const cy = Y[m] * FH
          sc += ov(r, { l: cx - 6, t: cy - 6, r: cx + 6, b: cy + 6 }) * 2
        }
        if (r.l < -20 || r.r > FW + 20 || r.t < -8 || r.b > FH + 10) sc += 1e5
        if (sc < bs) {
          bs = sc
          best = [dx, dy, r]
        }
      })
      const [dx, dy, r] = best!
      placed.push(r)
      this.stars[n].style.setProperty('--lx', dx.toFixed(1) + 'px')
      this.stars[n].style.setProperty('--ly', dy.toFixed(1) + 'px')
    }
    const M = Sky.FXM
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.fx.width = Math.round((FW + M * 2) * this.dpr)
    this.fx.height = Math.round((FH + M * 2) * this.dpr)
    this.fx.style.width = FW + M * 2 + 'px'
    this.fx.style.height = FH + M * 2 + 'px'
    const ready = this.onReady
    this.onReady = null
    ready?.()
  }

  /* ── 하늘 배경: 성운과 먼지 별(한 번 그리고, 층마다 반짝임·시차만 준다) ── */
  private paintSky() {
    const W = Math.ceil(this.bg.clientWidth) + 40
    const H = Math.ceil(this.bg.clientHeight) + 40
    if (W < 60 || H < 60) return
    const d = Math.min(2, window.devicePixelRatio || 1)
    const rnd = mulberry32(99)
    const gauss = () => {
      const u = Math.max(1e-6, rnd())
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
    }
    const ctxs = this.bgCanvases.map((c) => {
      c.width = Math.round(W * d)
      c.height = Math.round(H * d)
      c.style.width = W + 'px'
      c.style.height = H + 'px'
      const x = c.getContext('2d')!
      x.setTransform(d, 0, 0, d, 0, 0)
      return x
    })
    /* 은하수 축: 왼쪽 아래에서 오른쪽 위로 */
    const along = (t: number, off: number): Pt => {
      const x0 = -0.05 * W
      const y0 = 1.0 * H
      const x1 = 1.05 * W
      const y1 = 0.02 * H
      const lx = x1 - x0
      const ly = y1 - y0
      const len = Math.hypot(lx, ly)
      return [x0 + lx * t + (-ly / len) * off, y0 + ly * t + (lx / len) * off]
    }
    const far = ctxs[0]
    const glowAt = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      rgb: string,
      a: number
    ) => {
      const g = c.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(${rgb},${a})`)
      g.addColorStop(1, `rgba(${rgb},0)`)
      c.fillStyle = g
      c.beginPath()
      c.arc(x, y, r, 0, Math.PI * 2)
      c.fill()
    }
    const NEB = [
      '92,120,255',
      '150,96,230',
      '70,190,210',
      '255,150,190',
      '120,150,255',
    ]
    const span = Math.min(W, H)
    for (let i = 0; i < 34; i++) {
      const [x, y] = along(rnd(), gauss() * span * 0.1)
      glowAt(
        far,
        x,
        y,
        span * (0.12 + rnd() * 0.26),
        NEB[i % NEB.length],
        0.03 + rnd() * 0.055
      )
    }
    /* 띠의 먼지 */
    for (let i = 0; i < 2600; i++) {
      const t = rnd()
      const [x, y] = along(t, gauss() * span * (0.09 + 0.05 * Math.sin(t * 9)))
      far.fillStyle = `rgba(222,228,255,${(0.06 + rnd() * 0.32).toFixed(3)})`
      const r = 0.3 + rnd() * 0.55
      far.fillRect(x, y, r, r)
    }
    for (let i = 0; i < 420; i++) {
      far.fillStyle = `rgba(222,228,255,${(0.05 + rnd() * 0.25).toFixed(3)})`
      far.fillRect(rnd() * W, rnd() * H, 0.8, 0.8)
    }
    /* 어두운 먼지 결 */
    far.globalCompositeOperation = 'destination-out'
    for (let i = 0; i < 9; i++) {
      const [x, y] = along(0.1 + rnd() * 0.8, gauss() * span * 0.03)
      far.save()
      far.translate(x, y)
      far.rotate(-0.75 + gauss() * 0.15)
      far.scale(3.2, 0.5)
      glowAt(far, 0, 0, span * (0.05 + rnd() * 0.05), '0,0,0', 0.35)
      far.restore()
    }
    far.globalCompositeOperation = 'source-over'
    /* 반짝이는 별 세 층 */
    const TINTS = ['255,255,255', '214,226,255', '255,236,214', '200,220,255']
    for (let layer = 1; layer <= 3; layer++) {
      const c = ctxs[layer]
      for (let i = 0; i < 90; i++) {
        const [x, y]: Pt =
          rnd() < 0.45
            ? along(rnd(), gauss() * span * 0.16)
            : [rnd() * W, rnd() * H]
        const r = 0.4 + rnd() ** 2.4 * 1.3
        const a = 0.3 + rnd() * 0.6
        const tint = TINTS[Math.floor(rnd() * TINTS.length)]
        if (r > 1.05) glowAt(c, x, y, r * 6, tint, 0.14)
        c.fillStyle = `rgba(${tint},${a.toFixed(3)})`
        c.beginPath()
        c.arc(x, y, r, 0, Math.PI * 2)
        c.fill()
        if (r > 1.45) {
          c.strokeStyle = `rgba(${tint},0.22)`
          c.lineWidth = 0.6
          c.beginPath()
          c.moveTo(x - r * 6, y)
          c.lineTo(x + r * 6, y)
          c.moveTo(x, y - r * 6)
          c.lineTo(x, y + r * 6)
          c.stroke()
        }
      }
    }
  }

  /* ── 빛 효과(캔버스): 꼬리, 번쩍임, 별똥별. 할 일이 없으면 루프를 멈춘다 ── */
  private at(p: number | Pt): Pt {
    const { X, Y } = starLayout()
    const M = Sky.FXM
    return typeof p === 'number'
      ? [M + X[p] * this.FW, M + Y[p] * this.FH]
      : [M + p[0] * this.FW, M + p[1] * this.FH]
  }
  private fxKick() {
    if (!this.fxRaf) this.fxRaf = requestAnimationFrame(this.fxFrame)
  }
  private fxFrame = (now: number) => {
    this.fxRaf = 0
    if (this.walker) this.walker.tick(now)
    const c = this.fxc
    const M = Sky.FXM
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    c.clearRect(0, 0, this.FW + M * 2, this.FH + M * 2)
    c.globalCompositeOperation = 'lighter'
    if (this.walker) this.walker.draw(now)
    /* 효과가 도는 중에 새 효과를 더할 수 있어서, 목록을 떼어 낸 뒤 돌리고 다시 합친다 */
    const list = this.effects
    this.effects = []
    const keep = list.filter((e) => e(now) !== false)
    this.effects = keep.concat(this.effects)
    c.globalCompositeOperation = 'source-over'
    if (this.walker || this.effects.length) this.fxKick()
  }
  private fxClear() {
    this.effects = []
    cancelAnimationFrame(this.fxRaf)
    this.fxRaf = 0
    this.fxc.setTransform(1, 0, 0, 1, 0, 0)
    this.fxc.clearRect(0, 0, this.fx.width, this.fx.height)
  }
  private glow(x: number, y: number, r: number, stops: [number, string][]) {
    const c = this.fxc
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    stops.forEach(([o, col]) => g.addColorStop(o, col))
    c.fillStyle = g
    c.beginPath()
    c.arc(x, y, r, 0, Math.PI * 2)
    c.fill()
  }
  /** 번쩍임: 빛이 퍼지며 사라진다 */
  private flash(
    p: number | Pt,
    {
      r = 40,
      dur = 700,
      rgb = '255,255,255',
      a = 0.85,
    }: { r?: number; dur?: number; rgb?: string; a?: number } = {}
  ) {
    if (this.reduced() || !this.FW) return
    const t0 = performance.now()
    this.effects.push((now) => {
      const k = Math.max(0, (now - t0) / dur)
      if (k >= 1) return false
      const [x, y] = this.at(p)
      const al = a * (1 - k) ** 2
      this.glow(x, y, r * (0.3 + 0.7 * Math.sqrt(k)), [
        [0, `rgba(${rgb},${al})`],
        [0.35, `rgba(${rgb},${al * 0.35})`],
        [1, `rgba(${rgb},0)`],
      ])
    })
    this.fxKick()
  }
  /** 별똥별: a에서 b로 떨어지며 꼬리를 끈다 */
  private streak(
    a: number | Pt,
    b: number | Pt,
    {
      dur = 300,
      rgb = '255,255,255',
      len = 80,
      alpha = 1,
      onEnd,
    }: {
      dur?: number
      rgb?: string
      len?: number
      alpha?: number
      onEnd?: () => void
    } = {}
  ) {
    if (this.reduced() || !this.FW) {
      onEnd?.()
      return
    }
    const t0 = performance.now()
    let ended = false
    this.effects.push((now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur))
      const e = k ** 1.5
      const [ax, ay] = this.at(a)
      const [bx, by] = this.at(b)
      const dx = bx - ax
      const dy = by - ay
      const dl = Math.hypot(dx, dy) || 1
      const hx = ax + dx * e
      const hy = ay + dy * e
      const tl = Math.min(len, dl * e)
      const tx = hx - (dx / dl) * tl
      const ty = hy - (dy / dl) * tl
      const fade = k < 0.85 ? 1 : 1 - (k - 0.85) / 0.15
      const c = this.fxc
      const g = c.createLinearGradient(tx, ty, hx, hy)
      g.addColorStop(0, `rgba(${rgb},0)`)
      g.addColorStop(1, `rgba(${rgb},${0.95 * alpha * fade})`)
      c.strokeStyle = g
      c.lineWidth = 1.7
      c.lineCap = 'round'
      c.beginPath()
      c.moveTo(tx, ty)
      c.lineTo(hx, hy)
      c.stroke()
      this.glow(hx, hy, 9, [
        [0, `rgba(255,255,255,${0.9 * alpha * fade})`],
        [0.4, `rgba(${rgb},${0.4 * alpha * fade})`],
        [1, `rgba(${rgb},0)`],
      ])
      if (k >= 1) {
        if (!ended) {
          ended = true
          onEnd?.()
        }
        return false
      }
    })
    this.fxKick()
  }

  /* ── 안내: 오늘의 출발 별과 예시 별자리 ─────────────────────── */
  preview(start: number, example: number[]) {
    this.starsClear(s.today, s.pv)
    this.gPreview.replaceChildren()
    this.stars[start].classList.add(s.today)
    example.forEach((n, i) => {
      this.stars[n].classList.add(s.pv)
      if (i) this.addLine(this.gPreview, example[i - 1], n, s.pvl)
    })
  }

  /* ── 운세로 뽑기 ────────────────────────────────────────── */
  private clearFortune() {
    this.starsClear(s.gi, s.start, s.land, s.pass, s.flick, s.bloom, s.sel)
    for (let n = 1; n <= TOTAL; n++) delete this.stars[n].dataset.tone
    this.gConst.replaceChildren()
    this.gRoute.replaceChildren()
    this.field.classList.remove(s.climax, s.focus)
  }
  private markGi(o: Orbit) {
    for (let n = 1; n <= TOTAL; n++)
      this.stars[n].classList.toggle(s.gi, cellElement(n) === o.gi)
  }
  private landStar(n: number, i: number) {
    const star = this.stars[n]
    star.style.setProperty('--i', String(i))
    star.dataset.tone = ballTone(n)
    star.classList.add(s.land)
  }
  /** 걷기를 마친 모양(별자리) */
  paintFortune(o: Orbit) {
    this.stopWalk()
    this.clearFortune()
    this.markGi(o)
    this.stars[o.start].classList.add(s.start)
    o.picks.forEach((n, i) => {
      this.landStar(n, i)
      if (i)
        this.addLine(this.gConst, o.picks[i - 1], n, s.cl, {
          attrs: { 'data-b': String(n) },
        })
    })
  }

  /** 빛 한 점이 1–45 길을 따라 별을 건너간다. slow > 1이면 느리게. */
  walk(o: Orbit, ev: WalkEvents, slow = 1) {
    this.stopTimers()
    this.stopWalk()
    this.clearFortune()
    this.markGi(o)
    this.stars[o.start].classList.add(s.start)
    const { X, Y } = starLayout()
    const base = o.moves.map((m) =>
      m.land
        ? Math.min(1000, 420 + m.path.length * 30)
        : Math.min(560, 260 + m.path.length * 28)
    )
    const pause = o.moves.map((m) => (m.land ? 260 : 140))
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
    const natural = 800 + sum(base) + sum(pause)
    const sc = Math.min(1, 7300 / natural) * slow
    let t = 800 * sc
    const plan = o.moves.map((m, k) => {
      const p = {
        k,
        t0: t,
        dur: base[k] * sc,
        pts: [m.from, ...m.path],
        fired: 0,
        started: false,
        done: false,
      }
      t += (base[k] + pause[k]) * sc
      return p
    })
    const climaxT = t + 120 * slow
    const endT = climaxT + 1500 * slow
    const t0 = performance.now()
    const trail: { p: Pt; t: number }[] = []
    let pos: Pt = [X[o.start], Y[o.start]]
    let landed = 0
    let intro = false
    let climaxed = false
    let prevLand = 0

    const onHop = (p: (typeof plan)[number], j: number) => {
      const m = o.moves[p.k]
      const n = p.pts[j]
      if (j >= p.pts.length - 1) return
      if (m.land && j >= m.steps) {
        const sk = m.skipped[j - m.steps]
        this.restartClass(this.stars[n], s.flick, 600)
        ev.onSkip(p.k, n, sk?.why ?? 'gi')
      } else {
        const star = this.stars[n]
        star.classList.add(s.pass)
        setTimeout(() => star.classList.remove(s.pass), 230)
        this.flash(n, { r: 16, dur: 380, rgb: '190,210,255', a: 0.6 })
      }
    }
    const onEnd = (p: (typeof plan)[number]) => {
      const m = o.moves[p.k]
      if (!m.land) {
        this.flash(m.to, { r: 30, dur: 600, rgb: '150,180,255', a: 0.7 })
        ev.onEnd(p.k, null)
        return
      }
      const i = landed++
      this.landStar(m.to, i)
      this.restartClass(this.stars[m.to], s.bloom, 1150)
      const tone = TONE_RGB[ballTone(m.to)]
      this.flash(m.to, { r: 80, dur: 1000, rgb: tone, a: 0.75 })
      this.flash(m.to, { r: 22, dur: 500, rgb: '255,255,255', a: 1 })
      if (i)
        this.addLine(this.gConst, prevLand, m.to, s.cl, {
          ms: 520,
          attrs: { 'data-b': String(m.to) },
        })
      prevLand = m.to
      ev.onEnd(p.k, i)
    }

    this.walker = {
      tick: (now) => {
        const el = Math.max(0, now - t0)
        if (!intro && el > 160) {
          intro = true
          this.flash(o.start, { r: 46, dur: 900, rgb: '150,180,255', a: 0.8 })
        }
        let cur: (typeof plan)[number] | null = null
        for (const p of plan) {
          if (el < p.t0) break
          cur = p
          if (!p.started) {
            p.started = true
            ev.onMove(p.k)
          }
          const hops = p.pts.length - 1
          const k = Math.min(1, (el - p.t0) / p.dur)
          const e = 0.5 - Math.cos(Math.PI * k) / 2
          const reach = Math.min(hops, Math.floor(e * hops + 1e-6))
          while (p.fired < reach) {
            p.fired++
            onHop(p, p.fired)
          }
          if (k >= 1 && !p.done) {
            p.done = true
            onEnd(p)
          }
        }
        if (cur) {
          const hops = cur.pts.length - 1
          const k = Math.min(1, (el - cur.t0) / cur.dur)
          const e = (0.5 - Math.cos(Math.PI * k) / 2) * hops
          const i = Math.min(hops - 1, Math.floor(e))
          const f = e - i
          const a = cur.pts[i]
          const b = cur.pts[i + 1]
          pos = [X[a] + (X[b] - X[a]) * f, Y[a] + (Y[b] - Y[a]) * f]
        }
        trail.push({ p: pos, t: now })
        while (trail.length && now - trail[0].t > 460) trail.shift()
        if (el >= climaxT && !climaxed) {
          climaxed = true
          this.field.classList.add(s.climax)
          o.picks.forEach((n, i) =>
            this.later(i * 70, () =>
              this.flash(n, {
                r: 60,
                dur: 1100,
                rgb: TONE_RGB[ballTone(n)],
                a: 0.7,
              })
            )
          )
          ev.onClimax()
        }
        if (el >= endT) {
          this.walker = null
          this.paintFortune(o)
          ev.onFinish()
        }
      },
      draw: (now) => {
        const c = this.fxc
        for (let i = 1; i < trail.length; i++) {
          const a = Math.min(1, 1 - (now - trail[i].t) / 460)
          if (a <= 0) continue
          const [x0, y0] = this.at(trail[i - 1].p)
          const [x1, y1] = this.at(trail[i].p)
          c.strokeStyle = `rgba(190,210,255,${(a * 0.8).toFixed(3)})`
          c.lineWidth = 0.4 + 3 * a
          c.lineCap = 'round'
          c.beginPath()
          c.moveTo(x0, y0)
          c.lineTo(x1, y1)
          c.stroke()
        }
        if (climaxed) return
        const [x, y] = this.at(pos)
        const fade = Math.min(1, Math.max(0, (now - t0) / 400))
        this.glow(x, y, 22, [
          [0, `rgba(255,255,255,${0.95 * fade})`],
          [0.25, `rgba(170,195,255,${0.5 * fade})`],
          [1, 'rgba(120,150,255,0)'],
        ])
      },
    }
    this.fxKick()
  }

  stopWalk() {
    this.walker = null
    this.fxClear()
  }

  /** 공을 고르면 그 걸음의 길을 하늘에 다시 긋는다(null이면 해제) */
  select(o: Orbit, n: number | null) {
    const k = n == null ? -1 : o.moves.findIndex((m) => m.land && m.to === n)
    this.field.classList.toggle(s.focus, k >= 0)
    this.starsClear(s.sel)
    this.gRoute.replaceChildren()
    this.gConst
      .querySelectorAll(`.${s.cl}`)
      .forEach((l) =>
        l.classList.toggle(s.on, Number(l.getAttribute('data-b')) === n)
      )
    if (k < 0 || n == null) return
    const m = o.moves[k]
    this.stars[n].classList.add(s.sel)
    const { X, Y } = starLayout()
    const pts = [m.from, ...m.path]
    const pl = svgEl('polyline', {
      class: s.rt,
      points: pts
        .map((p) => `${(X[p] * 100).toFixed(2)},${(Y[p] * 100).toFixed(2)}`)
        .join(' '),
    })
    this.gRoute.append(pl)
    if (!this.reduced()) {
      this.growPath(pl, pts, Math.min(900, 260 + pts.length * 28))
      this.flash(n, { r: 54, dur: 800, rgb: TONE_RGB[ballTone(n)], a: 0.7 })
    }
  }

  /* ── 그냥 뽑기: 같은 하늘에 별똥별 ───────────────────────── */
  setCell(n: number, state: 'fixed' | 'excluded' | null) {
    this.stars[n].classList.toggle(s.fixed, state === 'fixed')
    this.stars[n].classList.toggle(s.excl, state === 'excluded')
  }
  clearRandom() {
    this.stopTimers()
    this.starsClear(s.pick, s.bloom)
    this.gRand.replaceChildren()
  }
  /** 뽑아 둔 게임을 하늘에 칠한다 */
  paintRandom(games: Game[]) {
    this.clearRandom()
    games.forEach((g, gi) =>
      g.order.forEach((n, j) => {
        this.stars[n].classList.add(s.pick)
        this.stars[n].style.setProperty('--gc', GAME_COLORS[gi])
        if (j)
          this.addLine(this.gRand, g.order[j - 1], n, s.rl, {
            attrs: { style: `--gc:${GAME_COLORS[gi]}` },
          })
      })
    )
  }
  /** 별똥별이 하나씩 떨어진다. 다 떨어지면 onDone */
  dropRandom(
    games: Game[],
    onBall: (gi: number, j: number) => void,
    onDone: () => void
  ) {
    this.clearRandom()
    if (this.reduced()) {
      this.paintRandom(games)
      onDone()
      return
    }
    const { X, Y } = starLayout()
    const queue: [number, number, number][] = []
    games.forEach((g, gi) => g.order.forEach((n, j) => queue.push([gi, j, n])))
    const stagger =
      queue.length > 1 ? Math.min(230, 2200 / (queue.length - 1)) : 0
    const rnd = mulberry32(Date.now() & 0xffff)
    queue.forEach(([gi, j, n], q) =>
      this.later(q * stagger, () => {
        const ang = -2.2 + rnd() * 0.9
        const from: Pt = [
          X[n] + Math.cos(ang) * 0.18,
          Y[n] + Math.sin(ang) * 0.5,
        ]
        this.streak(from, n, {
          dur: 280,
          rgb: GAME_RGB[gi],
          len: 90,
          onEnd: () => {
            const star = this.stars[n]
            star.style.setProperty('--gc', GAME_COLORS[gi])
            star.classList.add(s.pick)
            this.restartClass(star, s.bloom, 1100)
            this.flash(n, { r: 50, dur: 800, rgb: GAME_RGB[gi], a: 0.7 })
            if (j)
              this.addLine(this.gRand, games[gi].order[j - 1], n, s.rl, {
                ms: 260,
                attrs: { style: `--gc:${GAME_COLORS[gi]}` },
              })
            onBall(gi, j)
          },
        })
      })
    )
    this.later((queue.length - 1) * stagger + 420, onDone)
  }
}
