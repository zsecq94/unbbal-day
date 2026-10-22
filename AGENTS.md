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

## 라우팅

- 허브는 `/[lang]`, 게임은 `/[lang]/games/[game]`이다. 경로 문자열은 `lib/routes.ts`의 `hubPath()`, `gamePath()`로만 만든다.
- `app/[lang]/games/[game]/page.tsx`는 `GAMES`로 `generateStaticParams`해 모든 게임·로케일을 정적 생성한다. 로케일 아래 어떤 라우트에도 안 걸리는 경로는 `app/[lang]/[...rest]/page.tsx`가 `notFound()`로 보내고 `app/[lang]/not-found.tsx`가 그린다. 모르는 게임 키는 `[game]` 라우트가 먼저 잡으므로 `proxy.ts`가 `/[lang]/404`로 리라이트한다(정적 셸이 먼저 스트리밍되면 200이 나가서 페이지 안의 `notFound()`만으로는 부족하다).
- 게임 화면은 `components/games/registry.ts`의 `GAME_SCREENS`에 키로 등록한다. 등록이 없으면 `components/game-coming-soon.tsx`가 나온다. 스테이지는 `components/game-stage.tsx`, 허브 밖 페이지의 본문 틀과 상단바(홈 링크·로고·언어)는 `components/page-frame.tsx`, `components/top-bar.tsx`다.
- 게임 페이지의 `title`은 게임 이름만 넣는다. 루트 레이아웃의 `title.template`이 브랜드명을 붙인다.
- `partialPrefetching`이 켜져 있다. `params`는 페이지 최상위에서 `await`하지 않고 `<Suspense>` 안의 자식 컴포넌트에서 읽는다(`app/[lang]/games/[game]/page.tsx`의 `Stage`). URL에 안 묶이는 상단바는 바깥에 둔다. 게임으로 가는 링크는 `prefetch={true}`로 URL별 내용까지 미리 받아야 전환 모프가 성립한다.

## 페이지 전환

- React `ViewTransition`을 쓴다. 어휘(전환 타입, 공유 요소 이름)는 `lib/transitions.ts`에, 모션 CSS는 `app/globals.css`의 "View transitions"에 둔다.
- 페이지의 루트 요소는 `components/page-transition.tsx`의 `PageTransition`으로 감싼다. 링크는 `transitionTypes`로 방향을 붙인다(허브→게임 `NAV_FORWARD`, 게임→허브 `NAV_BACK`). 타입 없는 이동(브라우저 뒤로가기 등)은 즉시 교체되고 공유 요소만 모프한다.
- 눌림 피드백은 색이 아니라 모션으로만 준다. 타일은 `active:`에서 살짝 눌리고, 바로 프레임이 스테이지로 자라난다. 순서는 "이전 페이지 퇴장(120ms) → 프레임 이동(380ms) → 새 페이지 내용 등장(220ms부터)"이며 한 번에 한 가지만 움직인다.
- 공유 요소: 타일 프레임 ↔ 스테이지 프레임(`tileTransition`, `share="grow"`), 타일 심볼 ↔ 스테이지 헤더 심볼(`symbolTransition`, `share="morph"`), 로고(`BRAND_TRANSITION`, `share="morph"`). 프레임은 내용 없는 `absolute inset-0` span만 이름 붙인다. 스냅샷은 박스 밖 내용을 잘라내지 않아서 내용이 든 요소를 이름 붙이면 크기가 바뀔 때 새어 나온다. 이름 있는 `ViewTransition`에는 항상 `default="none"`을 함께 둔다.
- 자동 페어가 되려면 목적지 페이지가 프리페치돼 같은 커밋에 렌더돼야 한다. 게임 페이지에 요청 시점 값을 넣을 때는 Suspense 경계 안에 두어 정적 셸을 유지한다.
- `cacheComponents`에서는 이전 페이지가 언마운트되지 않고 `Activity`로 숨겨진다. 허브는 일시적 상태 초기화를 `useLayoutEffect` 클린업에서 하고, 누른 시점의 스크롤 위치·타일을 저장했다가 다시 보일 때 복원한다(`components/game-hub.tsx`). 허브로 돌아가는 링크는 `scroll={false}`를 붙여 Next의 스크롤 처리가 복원을 덮지 않게 한다.

## 다국어

- 로케일은 `lib/i18n.ts`의 `LOCALES`(`ko`, `en`)가 기준이다. 기본값은 `ko`, 쿠키 이름은 `NEXT_LOCALE`.
- 현재 로케일과 사전은 `app/[lang]/dictionaries.ts`의 `getLocale()`, `getDictionary()`로 읽는다.
- 사용자에게 보이는 문자열은 `app/[lang]/dictionaries/ko.json`, `en.json`에 둔다. 컴포넌트에 직접 쓰지 않는다.
- `Dictionary` 타입은 `ko.json`에서 유도된다. 두 파일의 키 구조를 항상 같게 유지한다. `dictionaries.ts`의 `dictionariesMatch` 타입 단언이 tsc에서 이를 검사한다.
- 치환은 `{name}` 플레이스홀더, 본문 강조는 `{ "b": "..." }` 배열 패턴을 쓴다.
- 로케일을 추가하면 `LOCALES`, 사전 파일, `components/locale-switch.tsx`의 경로 정규식을 함께 바꾼다.

## 게임 데이터

- `lib/games.ts`에는 언어 무관 메타(`key`, `kind`, `motion`)만 둔다. 이름과 설명은 사전의 `games.<key>`에 둔다.
- 게임을 추가할 때 손대는 곳은 `GameKey`와 `GAMES`, 두 사전의 `games.<key>`, `components/game-symbol.tsx`의 `SYMBOLS`, `components/game-hub.tsx`의 `PLACEMENT`다. 화면이 준비되면 `components/games/registry.ts`에 등록한다.
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

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
