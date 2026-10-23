/* 시안용 사주 엔진: lib/saju의 TypeScript에서 타입만 지워 브라우저 ES 모듈로 옮긴 뒤,
   shared/lotto.js와 함께 일반 스크립트 하나(shared/lotto.bundle.js, window.Lotto)로 묶는다.
   시안은 묶음을 쓰므로 http 서버 없이 파일로 열어도 동작한다(file://는 모듈 import를 막는다).
   앱과 같은 원국·일진·용신을 시안에서 쓰기 위해서다. 만든 파일은 손으로 고치지 않는다.
   사용: node mockups/tools/build-saju.mjs (esbuild는 npx로 저장소 밖에서 받는다) */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const root = new URL('../../', import.meta.url)
const out = new URL('mockups/shared/saju/', root)
mkdirSync(out, { recursive: true })
const FILES = ['ganji', 'terms', 'time', 'solar-terms-data', 'chart', 'reading', 'lunar']
for (const name of FILES) {
  const src = readFileSync(new URL(`lib/saju/${name}.ts`, root), 'utf8')
  const js = stripTypeScriptTypes(src, { mode: 'strip' })
    /* 타입만 가져오던 import는 지우고, 별칭 경로는 상대 경로로 바꾼다 */
    .replace(/^\s*import\s*\{\s*\}\s*from\s*'[^']+'\s*$/gm, '')
    .replace(/'@\/lib\/saju\/([\w-]+)'/g, "'./$1.js'")
    .replace(
      "'korean-lunar-calendar'",
      "'../../../node_modules/korean-lunar-calendar/dist/korean-lunar-calendar.mjs'"
    )
  writeFileSync(new URL(`${name}.js`, out), `/* lib/saju/${name}.ts에서 생성됨(mockups/tools/build-saju.mjs) */\n${js}`)
}
console.log('mockups/shared/saju/', FILES.join(', '))

const banner =
  '/* eslint-disable */ /* mockups/shared/lotto.js와 shared/saju/를 묶은 일반 스크립트(file://에서도 열리게). mockups/tools/build-saju.mjs가 만든다. 손으로 고치지 않는다. */'
execFileSync(
  'npx',
  ['-y', 'esbuild@0.25', 'mockups/shared/lotto.js', '--bundle', '--format=iife', '--global-name=Lotto',
    '--charset=utf8', '--legal-comments=none', `--banner:js=${banner}`, '--outfile=mockups/shared/lotto.bundle.js'],
  { cwd: new URL('.', root), stdio: 'inherit' }
)
