<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 프로젝트

- 운빨데이. Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, npm.
- 명령은 `npm run dev`, `npm run build`, `npm run lint`, `npm run format`, `npm run check`.
- `npm run check`(`next typegen`, 타입체크, ESLint, Prettier 검사)와 `npm run build`가 통과하는 상태를 유지한다. `git commit` 전에 훅이 `npm run check`를 자동 실행하고 실패하면 커밋을 막는다.
- `.next/types` 생성 타입 때문에 tsc가 실패하면(라우트 삭제·이름변경 뒤) `next typegen` 또는 dev 서버 재시작으로 재생성한다.

## 코드 컨벤션

- 포맷은 `.prettierrc`를 따른다. 세미콜론 없음, 작은따옴표, 80자, Tailwind 클래스 자동 정렬.
- 파일명은 kebab-case, 컴포넌트는 named export, import 경로는 `@/` 별칭을 쓴다.

## Next.js 16

- 미들웨어 파일은 `middleware.ts`가 아니라 `proxy.ts`다. 로케일 판별과 리다이렉트는 여기서 한다.
- `cacheComponents`가 켜져 있다. 쿠키, 헤더, 현재 시각 같은 요청 시점 값은 정적 셸 바깥(Suspense 경계 안 또는 클라이언트)에서 다룬다. 방문자 시간대 기준 날짜는 `components/today-date.tsx`의 인라인 스크립트 방식을 쓴다.

## 다국어

- 로케일은 `lib/i18n.ts`의 `LOCALES`(`ko`, `en`)가 기준이다. 기본값은 `ko`, 쿠키 이름은 `NEXT_LOCALE`.
- 현재 로케일과 사전은 `app/[lang]/dictionaries.ts`의 `getLocale()`, `getDictionary()`로 읽는다.
- 사용자에게 보이는 문자열은 `app/[lang]/dictionaries/ko.json`, `en.json`에 둔다. 컴포넌트에 직접 쓰지 않는다.
- `Dictionary` 타입은 `ko.json`에서 유도된다. 두 파일의 키 구조를 항상 같게 유지한다. `dictionaries.ts`의 `dictionariesMatch` 타입 단언이 tsc에서 이를 검사한다.
- 치환은 `{name}` 플레이스홀더, 본문 강조는 `{ "b": "..." }` 배열 패턴을 쓴다.
- 로케일을 추가하면 `LOCALES`, 사전 파일, `components/locale-switch.tsx`의 경로 정규식을 함께 바꾼다.

## 게임 데이터

- `lib/games.ts`에는 언어 무관 메타(`key`, `kind`, `motion`)만 둔다. 이름과 설명은 사전의 `games.<key>`에 둔다.
- 게임을 추가할 때 손대는 곳은 `GameKey`와 `GAMES`, 두 사전의 `games.<key>`, `components/game-symbol.tsx`의 `SYMBOLS`, `components/game-hub.tsx`의 `PLACEMENT`다.
- 허브 심볼은 48×48 그리드의 라인 아이콘이다. 채울 패스에는 `className="f"`를 붙인다.

## 스타일

- 디자인 토큰(색, 폰트, 반경, 이징)은 `app/globals.css`의 `@theme`에 정의되어 있다. 토큰이 있는 값은 토큰 클래스를 쓴다.
- 커스텀 variant `lit`, `group-lit`(호버 가능 기기의 hover + focus-visible)과 `fit`(허브가 한 화면에 들어가는 데스크톱)이 정의되어 있다.
- 포커스 링은 `focus-visible:outline-2 focus-visible:outline-offset-* focus-visible:outline-ink` 패턴을 쓴다.

## Git

- 커밋은 `main` 브랜치에 직접 한다. 별도 작업 브랜치를 만들지 않는다.
- 커밋 메시지는 한국어로, `type: 요약` 형식(feat, fix, docs, chore 등)을 따른다. 본문은 `-` 목록으로 변경 내용을 적는다.
- 커밋 메시지와 문서에 디자인 시안의 내부 별칭을 쓰지 않는다. 기능과 변경 내용으로 설명한다.
- 푸시는 요청이 있을 때만 한다.
