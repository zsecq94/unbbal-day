/**
 * 한글 이름 획수 궁합. 널리 알려진 놀이 규칙을 그대로 따른다.
 *
 * 1. 성을 포함한 두 이름을 한 글자씩 번갈아 놓는다(먼저 쓴 이름의 첫 글자부터).
 *    길이가 다르면 남는 글자를 뒤에 이어 붙인다(종이에 손으로 쓸 때와 같다).
 * 2. 글자마다 자모 획수의 합을 적는다.
 * 3. 이웃한 두 수를 더해 일의 자리만 남기기를 두 자리가 남을 때까지 반복한다.
 * 4. 남은 두 자리를 점수로 읽는다(07은 7점). 세 자리가 1·0·0이 되면 거기서 멈춰
 *    100점, 마지막 두 자리가 00이어도 100점으로 읽는다.
 *
 * 먼저 쓰는 이름에 따라 결과가 달라지는 것이 이 놀이의 원래 성질이라 두 방향을
 * 모두 계산한다.
 *
 * 획수표는 이름 궁합 계산기·글 19곳을 모아 글자별 다수결로 정했다. 꺾일 때마다
 * 1획으로 세는 표(ㄱ2 ㄴ2 ㄷ3 ㄹ5 ㅁ4 …)가 15곳으로 압도적이고, 실제 필순으로
 * 세는 표(ㄱ1 ㄴ1 ㄷ2 ㄹ3 ㅁ3 …)는 소수다. 쌍자음·겹받침·겹모음은 모든 출처가
 * 구성 자모 획수의 합으로 센다. 주요 출처:
 *   https://bluewings.github.io/name-compatibility/
 *   https://gist.github.com/wagurano/9cd4f5527e22bd253aad
 *   https://sangdammoa.com/fun/name-match
 *   https://testmoa.com/test/name-compatibility
 *   https://pann.nate.com/talk/200198541 (2009년 손 계산 글)
 *   https://github.com/sarojaba/name-matcher-test (2015년 테스트 기대값)
 * 검증은 `npm run verify:match`.
 */

/** 기본 자모의 획수(자음 14개, 모음 10개 순). 나머지 자모는 이것들의 합이다. */
export const BASE_STROKES: Record<string, number> = {
  ㄱ: 2,
  ㄴ: 2,
  ㄷ: 3,
  ㄹ: 5,
  ㅁ: 4,
  ㅂ: 4,
  ㅅ: 2,
  ㅇ: 1,
  ㅈ: 3,
  ㅊ: 4,
  ㅋ: 3,
  ㅌ: 4,
  ㅍ: 4,
  ㅎ: 3,
  ㅏ: 2,
  ㅑ: 3,
  ㅓ: 2,
  ㅕ: 3,
  ㅗ: 2,
  ㅛ: 3,
  ㅜ: 2,
  ㅠ: 3,
  ㅡ: 1,
  ㅣ: 1,
}

/* 유니코드 한글 음절의 초성·중성·종성 순서. 겹자모는 구성 자모로 풀어 적는다. */
const CHO =
  'ㄱ ㄱㄱ ㄴ ㄷ ㄷㄷ ㄹ ㅁ ㅂ ㅂㅂ ㅅ ㅅㅅ ㅇ ㅈ ㅈㅈ ㅊ ㅋ ㅌ ㅍ ㅎ'.split(
    ' '
  )
const JUNG =
  'ㅏ ㅏㅣ ㅑ ㅑㅣ ㅓ ㅓㅣ ㅕ ㅕㅣ ㅗ ㅗㅏ ㅗㅏㅣ ㅗㅣ ㅛ ㅜ ㅜㅓ ㅜㅓㅣ ㅜㅣ ㅠ ㅡ ㅡㅣ ㅣ'.split(
    ' '
  )
const JONG = [
  '',
  ...'ㄱ ㄱㄱ ㄱㅅ ㄴ ㄴㅈ ㄴㅎ ㄷ ㄹ ㄹㄱ ㄹㅁ ㄹㅂ ㄹㅅ ㄹㅌ ㄹㅍ ㄹㅎ ㅁ ㅂ ㅂㅅ ㅅ ㅅㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ'.split(
    ' '
  ),
]

const sum = (jamo: string) => [...jamo].reduce((n, j) => n + BASE_STROKES[j], 0)
const SYLLABLE_START = 0xac00
const SYLLABLE_END = 0xd7a3

/** 완성형 한글 음절 하나의 획수. 한글 음절이 아니면 null. */
export function syllableStrokes(ch: string): number | null {
  const code = ch.codePointAt(0) ?? 0
  if (ch.length !== 1 || code < SYLLABLE_START || code > SYLLABLE_END)
    return null
  const i = code - SYLLABLE_START
  return (
    sum(CHO[Math.floor(i / 588)]) +
    sum(JUNG[Math.floor((i % 588) / 28)]) +
    sum(JONG[i % 28])
  )
}

/** 공백을 지운 이름. 완성형 한글 음절로만 되어 있으면 그 글자들, 아니면 null. */
export function hangulName(input: string): string[] | null {
  const chars = [...input.replace(/\s+/g, '')]
  return chars.length > 0 && chars.every((c) => syllableStrokes(c) !== null)
    ? chars
    : null
}

/** 먼저 쓴 이름의 첫 글자부터 번갈아 놓고, 남는 글자는 뒤에 이어 붙인다. */
export function interleave(first: string[], second: string[]) {
  const out: string[] = []
  for (let i = 0; i < Math.max(first.length, second.length); i++) {
    if (i < first.length) out.push(first[i])
    if (i < second.length) out.push(second[i])
  }
  return out
}

export type StrokeReading = {
  /** 번갈아 놓은 글자 */
  letters: string[]
  /** 글자마다 어느 이름의 글자인지(0 = 먼저 쓴 이름) */
  owners: number[]
  /** 첫 줄은 글자별 획수, 그다음 줄부터 이웃 합의 일의 자리 */
  rows: number[][]
  /** 0–100 */
  score: number
}

/** 획수 줄을 두 자리(또는 1·0·0)가 될 때까지 줄여 점수를 낸다. */
export function reduceStrokes(
  first: number[]
): Pick<StrokeReading, 'rows' | 'score'> {
  /* 글자가 둘뿐이면 첫 줄이 곧 마지막 줄이다. 10획이 넘는 글자는 일의 자리만 쓴다. */
  const rows = [first.length === 2 ? first.map((n) => n % 10) : first]
  for (;;) {
    const row = rows[rows.length - 1]
    if (row.length === 3 && row.join('') === '100') return { rows, score: 100 }
    if (row.length <= 2) {
      const [a, b] = row
      return { rows, score: a === 0 && b === 0 ? 100 : a * 10 + b }
    }
    rows.push(row.slice(1).map((n, i) => (row[i] + n) % 10))
  }
}

/** 먼저 쓴 이름(first) 쪽에서 본 궁합. 두 이름 모두 한 글자 이상이어야 한다. */
export function strokeReading(
  first: string[],
  second: string[]
): StrokeReading {
  const letters = interleave(first, second)
  const owners = interleave(
    first.map(() => '0'),
    second.map(() => '1')
  ).map(Number)
  const strokes = letters.map((c) => syllableStrokes(c) ?? 0)
  return { letters, owners, ...reduceStrokes(strokes) }
}
