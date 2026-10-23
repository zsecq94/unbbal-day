import {
  latinName,
  lovesReading,
  type LovesReading,
} from '@/lib/name-match/loves'
import {
  hangulName,
  strokeReading,
  type StrokeReading,
} from '@/lib/name-match/strokes'

/**
 * 이름 궁합. 계산 방식은 화면 언어가 아니라 입력한 글자로 고른다. 두 이름이
 * 모두 한글이면 획수 궁합(strokes.ts), 모두 로마자면 LOVES 놀이(loves.ts)다.
 * 난수와 날짜를 쓰지 않아 같은 두 이름은 언제나 같은 결과가 나온다.
 */
export type NameMatch =
  | {
      kind: 'strokes'
      names: [string[], string[]]
      /** 첫 이름을 먼저 쓴 쪽, 두 번째 이름을 먼저 쓴 쪽 */
      readings: [StrokeReading, StrokeReading]
    }
  /** names는 화면에 보일 이름(입력 그대로, 앞뒤 공백만 지움) */
  | { kind: 'loves'; names: [string, string]; reading: LovesReading }

export type NameMatchError = 'empty' | 'mixed' | 'unsupported'

/** 한 이름에 들어갈 수 있는 한글 글자 수(성 포함). 남궁·제갈 같은 복성까지 담는다. */
export const MAX_HANGUL = 5
/** 한 이름에 들어갈 수 있는 로마자 글자 수 */
export const MAX_LATIN = 40

export function nameMatch(
  a: string,
  b: string
): NameMatch | { error: NameMatchError } {
  if (!a.trim() || !b.trim()) return { error: 'empty' }
  const [ha, hb] = [hangulName(a), hangulName(b)]
  if (ha && hb) {
    if (ha.length > MAX_HANGUL || hb.length > MAX_HANGUL)
      return { error: 'unsupported' }
    return {
      kind: 'strokes',
      names: [ha, hb],
      readings: [strokeReading(ha, hb), strokeReading(hb, ha)],
    }
  }
  const [la, lb] = [latinName(a), latinName(b)]
  if (la && lb) {
    if (la.length > MAX_LATIN || lb.length > MAX_LATIN)
      return { error: 'unsupported' }
    return {
      kind: 'loves',
      names: [a.trim(), b.trim()],
      reading: lovesReading(la, lb),
    }
  }
  return { error: (ha || la) && (hb || lb) ? 'mixed' : 'unsupported' }
}
