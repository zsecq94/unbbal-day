/**
 * 영어 이름 궁합, "LOVES" 놀이. 영국 놀이터에서 널리 하는 놀이로, 이 놀이를
 * 다룬 논문(Johnston, "Endless love", arXiv:1602.03556)의 규칙을 따른다.
 *
 * 1. "A LOVES B"라고 쓰고, 두 이름 안에서 L·O·V·E·S가 각각 몇 번 나오는지 센다.
 *    가운데 LOVES라는 단어는 세지 않는다. 대소문자는 가리지 않고, 글자가 아닌
 *    것(공백, 하이픈, 아포스트로피)은 지운다.
 * 2. 이웃한 두 수를 더해 새 줄을 만든다. 합이 10 이상이면 두 자리를 쪼개 적는다
 *    (12 → 1, 2).
 * 3. 두 자리가 남으면 멈추고 퍼센트로 읽는다(최대 99).
 *
 * 두 이름을 합쳐 세므로 순서와 상관없이 결과가 같다. 어떤 이름 쌍은 줄이
 * 끝나지 않고 같은 모양을 되풀이하거나 계속 길어진다(논문의 주제). 이때의
 * 전통 규칙은 없어서 "끝없는 사랑"으로 따로 알린다.
 *
 * 악센트 글자(é 등)는 정해진 규칙이 없어 기본 글자로 본다(é → E).
 *   https://arxiv.org/abs/1602.03556
 *   https://www.birmingham.ac.uk/news-archive/2016/calculating-endless-love
 *   https://guides.brit.co/guides/make-a-love-calculator
 */

export const LOVES = ['L', 'O', 'V', 'E', 'S'] as const

/** 줄이 이만큼 길어지면 끝나지 않는 쌍으로 본다(논문의 66666처럼 계속 자란다). */
const MAX_DIGITS = 40

/** 로마자 이름을 대문자 글자만 남겨 정리한다. 로마자 이름이 아니면 null. */
export function latinName(input: string): string | null {
  const letters = input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[\s'’.-]/g, '')
  return /^[A-Z]+$/.test(letters) ? letters : null
}

export type LovesReading = {
  /** L·O·V·E·S 개수 */
  counts: number[]
  /**
   * 줄마다 칸 묶음. 첫 줄은 개수 하나씩([[1],[0],…]), 그다음 줄부터는 이웃 합이
   * 10 이상이면 쪼갠 두 자리가 한 묶음이다([[1,2],[5]…]).
   */
  rows: number[][][]
} & (
  | { score: number; endless: null }
  /** 줄이 같은 모양을 되풀이한다. loopTo는 되돌아가는 줄의 번호(0부터)다. */
  | { score: null; endless: 'cycle'; loopTo: number }
  /** 줄이 계속 길어진다. */
  | { score: null; endless: 'grow' }
)

/** 개수 줄을 두 자리가 될 때까지 줄인다. */
export function reduceLoves(counts: number[]): LovesReading {
  const rows = [counts.map((n) => [n])]
  const seen = new Map([[counts.join(','), 0]])
  for (;;) {
    const row = rows[rows.length - 1].flat()
    if (row.length <= 2)
      return { counts, rows, score: row[0] * 10 + row[1], endless: null }
    const next = row.slice(1).map((n, i) => [...String(row[i] + n)].map(Number))
    const key = next.flat().join(',')
    const loopTo = seen.get(key)
    if (loopTo !== undefined)
      return { counts, rows, score: null, endless: 'cycle', loopTo }
    if (next.flat().length > MAX_DIGITS)
      return { counts, rows, score: null, endless: 'grow' }
    seen.set(key, rows.length)
    rows.push(next)
  }
}

/** 정리된 두 이름(latinName의 결과)의 궁합 */
export function lovesReading(a: string, b: string): LovesReading {
  const both = a + b
  return reduceLoves(LOVES.map((c) => both.split(c).length - 1))
}
