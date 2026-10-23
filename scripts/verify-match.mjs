/**
 * 이름 궁합 검증. lib/name-match의 계산을 공개된 손 계산 예시, 계산기 결과,
 * 테스트 기대값, 논문 예시에 맞춰 본다.
 *
 *   node scripts/verify-match.mjs
 */
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

/* `@/` 별칭과 확장자 없는 경로를 TypeScript 파일로 푼다 */
const root = fileURLToPath(new URL('..', import.meta.url))
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) {
      const file = root + specifier.slice(2)
      for (const ext of ['.ts', '.tsx'])
        if (existsSync(file + ext))
          return { url: pathToFileURL(file + ext).href, shortCircuit: true }
    }
    return next(specifier, context)
  },
})

const { nameMatch } = await import('@/lib/name-match/index')
const { syllableStrokes, reduceStrokes } =
  await import('@/lib/name-match/strokes')
const { reduceLoves, latinName } = await import('@/lib/name-match/loves')

let pass = 0
const fails = []
const check = (label, got, want) => {
  const g = JSON.stringify(got)
  const w = JSON.stringify(want)
  if (g === w) pass++
  else fails.push(`${label}\n    기대 ${w}\n    결과 ${g}`)
}
const rows = (s) => s.split(' / ').map((r) => r.split(' ').map(Number))

/* ── 한글: 획수표 ───────────────────────────────────────────── */

/* 음절 획수. 쌍자음 = 홑자음 × 2, 겹받침·겹모음 = 구성 자모의 합 */
for (const [ch, n] of [
  ['김', 7], // 출처 k-calc, mimmi
  ['박', 8], // mimmi, beforeforget
  ['한', 7], // mimmi
  ['이', 2], // 네이트판 2009
  ['심', 7],
  ['수', 4],
  ['순', 6],
  ['일', 7],
  ['애', 4],
  ['까', 6], // ㄲ4 + ㅏ2
  ['뷁', 4 + 5 + 7], // ㅂ4 + ㅞ5 + ㄺ7
  ['의', 3], // ㅇ1 + ㅢ2
  ['닭', 3 + 2 + 7],
  ['값', 2 + 2 + 6],
])
  check(`획수 ${ch}`, syllableStrokes(ch), n)

/* ── 한글: 단계까지 실린 예시 (먼저 쓴 이름 → 상대) ─────────────── */

const strokeCases = [
  // bluewings 코드 주석
  ['배성재', '장예원', '7 6 5 5 6 7 / 3 1 0 1 3 / 4 1 1 4 / 5 2 5 / 7 7', 77],
  // wagurano gist
  ['성유리', '이효리', '5 2 4 6 6 6 / 7 6 0 2 2 / 3 6 2 4 / 9 8 6 / 7 4', 74],
  // velog ongong999: 마지막 00은 100점
  ['배트맨', '캣우먼', '7 8 5 3 9 8 / 5 3 8 2 7 / 8 1 0 9 / 9 1 9 / 0 0', 100],
  ['강백호', '채소연', '5 7 9 4 5 6 / 2 6 3 9 1 / 8 9 2 0 / 7 1 2 / 8 3', 83],
  // 상담모아: 양방향 44 / 46
  ['김민준', '박서연', '7 8 7 4 7 6 / 5 5 1 1 3 / 0 6 2 4 / 6 8 6 / 4 4', 44],
  ['박서연', '김민준', '8 7 4 7 6 7 / 5 1 1 3 3 / 6 2 4 6 / 8 6 0 / 4 6', 46],
  // wagurano: 결과 "1"(0X는 X점)
  ['장동건', '고소영', '6 4 6 4 6 5 / 0 0 0 0 1 / 0 0 0 1 / 0 0 1 / 0 1', 1],
]
for (const [a, b, want, score] of strokeCases) {
  const m = nameMatch(a, b)
  check(`${a} → ${b} 단계`, m.readings[0].rows, rows(want))
  check(`${a} → ${b} 점수`, m.readings[0].score, score)
}

/* ── 한글: 점수만 실린 예시 ───────────────────────────────────── */

const scoreCases = [
  // bluewings 양방향
  ['공효진', '차태현', 94],
  ['차태현', '공효진', 7],
  ['공효진', '김수현', 17],
  ['김수현', '공효진', 35],
  ['차태현', '김수현', 9],
  ['김수현', '차태현', 14],
  // sarojaba/name-matcher-test (2015) 중 길이가 같은 쌍. 길이가 다른 쌍은 그
  // 테스트가 빈자리를 0획으로 채우는 방식이라 이 놀이의 손 계산(남는 글자를
  // 뒤에 붙임)과 다르다.
  ['우준혁', '김소은', 75],
  ['우준혁', '박민영', 35],
  ['우준혁', '박신혜', 55],
  ['우준혁', '손예진', 72],
  ['우준혁', '송혜교', 12],
  ['우준혁', '신민아', 10],
  ['우준혁', '아이유', 39],
  ['우준혁', '이다혜', 19],
  ['우준혁', '이연희', 53],
  ['우준혁', '하지원', 96],
  ['우준혁', '한지민', 78],
  ['우준혁', '한효주', 58],
  ['연정훈', '한가인', 37],
  ['한가인', '연정훈', 31],
  ['이병헌', '이민정', 30],
  ['이민정', '이병헌', 9],
]
for (const [a, b, score] of scoreCases)
  check(`${a} → ${b}`, nameMatch(a, b).readings[0].score, score)

/* ── 한글: 규칙 ─────────────────────────────────────────────── */

{
  // 길이가 다르면 남는 글자를 뒤에 붙인다
  const m = nameMatch('원빈', '이나영')
  check('원빈 · 이나영 배치', m.readings[0].letters, [...'원이빈나영'])
  check('이나영 · 원빈 배치', m.readings[1].letters, [...'이원나빈영'])
  // 공백은 지운다
  check('공백', nameMatch(' 배 성재', '장예원 ').readings[0].score, 77)
  // 세 자리 1·0·0에서 멈추면 100점, 마지막 두 자리 00도 100점
  check('1·0·0에서 멈춤', reduceStrokes([1, 0, 0, 0]), {
    rows: rows('1 0 0 0 / 1 0 0'),
    score: 100,
  })
  check('00은 100점', reduceStrokes([9, 1, 9, 1]), {
    rows: rows('9 1 9 1 / 0 0 0 / 0 0'),
    score: 100,
  })
  // 글자가 둘뿐이면 10획 넘는 글자는 일의 자리만 쓴다
  check('글자 둘', reduceStrokes([7, 11]), { rows: [[7, 1]], score: 71 })
  // 글자마다 어느 이름의 글자인지
  check('원빈 · 이나영 주인', m.readings[0].owners, [0, 1, 0, 1, 1])
}

/* ── 영어: LOVES ─────────────────────────────────────────────── */

const lovesCases = [
  // 논문·보도자료
  ['Alice', 'Bob', '1 1 0 1 0 / 2 1 1 1 / 3 2 2 / 5 4', 54],
  // Brit+Co (중간 줄은 출처 캡션과 맞춰 다시 계산)
  [
    'Declan Donnelly',
    'Ashley Roberts',
    '4 2 0 4 2 / 6 2 4 6 / 8 6 1 0 / 1 4 7 1 / 5 1 1 8 / 6 2 9 / 8 1 1 / 9 2',
    92,
  ],
  // 논문의 99점 예
  ['Joseph', 'Chloe', '1 2 0 2 1 / 3 2 2 3 / 5 4 5 / 9 9', 99],
]
for (const [a, b, want, score] of lovesCases) {
  const m = nameMatch(a, b)
  check(
    `${a} LOVES ${b} 단계`,
    m.reading.rows.map((r) => r.flat()),
    rows(want)
  )
  check(`${a} LOVES ${b} 점수`, m.reading.score, score)
  check(`${b} LOVES ${a} 순서 무관`, nameMatch(b, a).reading.score, score)
}

/* 논문의 끝나지 않는 쌍 */
check('Steve-O · Esmie', nameMatch('Steve-O', 'Esmie').reading.endless, 'cycle')
check(
  'Reese Witherspoon · Calvin Harris',
  nameMatch('Reese Witherspoon', 'Calvin Harris').reading.endless,
  'cycle'
)
/* 논문의 숫자열 예 */
{
  const a = reduceLoves([7, 3, 9, 1, 7])
  check('73917 → 65', [a.score, a.rows.length - 1], [65, 24])
  const b = reduceLoves([4, 0, 3, 9, 0])
  check('40390 → 22', [b.score, b.rows.length - 1], [22, 35])
  check('14121 순환', reduceLoves([1, 4, 1, 2, 1]).endless, 'cycle')
  // 쪼갠 두 자리는 한 묶음, 순환은 되돌아가는 줄 번호를 남긴다
  check('쪼갠 칸 묶음', reduceLoves([9, 9, 9, 9, 9]).rows[1], [
    [1, 8],
    [1, 8],
    [1, 8],
    [1, 8],
  ])
  const steve = nameMatch('Steve-O', 'Esmie').reading
  check('순환 되돌아감', [steve.rows.length, steve.loopTo], [6, 4])
  check('66666 자람', reduceLoves([6, 6, 6, 6, 6]).endless, 'grow')
}
/* 이름 정리 */
check('악센트', latinName('Zoë'), 'ZOE')
check('아포스트로피', latinName("O'Neil"), 'ONEIL')

/* ── 입력 판정 ───────────────────────────────────────────────── */

check('빈 이름', nameMatch(' ', '김민준'), { error: 'empty' })
check('한글·로마자 섞임', nameMatch('김민준', 'Alice'), { error: 'mixed' })
check('낱자모', nameMatch('ㅋㅋ', '김민준'), { error: 'unsupported' })
check('숫자', nameMatch('김민준2', '박서연'), { error: 'unsupported' })
check('여섯 글자', nameMatch('가나다라마바', '김민준'), {
  error: 'unsupported',
})

console.log(`이름 궁합 검증: ${pass}개 통과, ${fails.length}개 실패`)
for (const f of fails) console.log(`  ✗ ${f}`)
process.exit(fails.length ? 1 : 0)
