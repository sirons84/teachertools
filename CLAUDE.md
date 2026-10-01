@AGENTS.md

# 티처툴즈 (TeacherTools) — 프로젝트 컨텍스트

## 기술 스택
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 (no shadcn/ui — 커스텀 컴포넌트)
- **DB**: Neon (PostgreSQL + pgvector) via Prisma 7
- **ORM**: Prisma 7 — `prisma/prisma.config.ts`로 CLI 설정, `lib/db.ts`에서 `@prisma/adapter-pg`로 런타임 연결
- **File storage**: Vercel Blob (`@vercel/blob`)
- **AI**: OpenAI GPT-4o-mini (번역 + 채팅), text-embedding-3-small (RAG 임베딩)
- **Package manager**: pnpm

## 주요 규칙
- `@/*` 경로는 프로젝트 루트(`./`)를 가리킴 (src/ 없음)
- `prisma/` 폴더는 tsconfig에서 제외됨 (타입 충돌 방지)
- Prisma 7: datasource에 `url` 미사용 → `prisma.config.ts`에서 `datasource.url` 설정
- DB 스키마 변경 후: `pnpm db:push` 실행
- pgvector 쿼리는 `$executeRaw` / `$queryRaw` 사용 (Prisma ORM 미지원)

## 폴더 구조
```
app/                  # Next.js App Router
  api/upload/         # 파일 업로드 API
  api/translate/      # 번역 API (번역 캐시)
  api/chat/           # RAG 채팅 API (스트리밍)
  api/documents/[id]/ # 문서 조회 API
  services/sotongmun/ # 가정통신문 서비스
    upload/           # 교사 업로드 페이지
    result/[id]/      # QR 결과 페이지
    view/[id]/        # 학부모 열람 페이지
components/
  layout/             # Header, Footer, ServiceCard
  sotongmun/          # 서비스 전용 컴포넌트
  common/             # 공통 컴포넌트
constants/            # languages.ts, services.ts (서비스 추가 시 여기만 수정)
lib/                  # db, openai, hwpx-parser, pdf-parser, translator, embeddings, utils
prisma/               # schema.prisma, prisma.config.ts
types/                # TypeScript 타입 정의
```

## 새 서비스 추가 방법
1. `constants/services.ts`에 `SERVICES` 배열에 항목 추가
2. `app/services/[서비스명]/` 폴더에 페이지 추가
3. 메인 페이지는 자동으로 카드 렌더링

## 환경 변수 (.env.local)
```
DATABASE_URL=       # Neon PostgreSQL 연결 문자열
OPENAI_API_KEY=     # OpenAI API 키
BLOB_READ_WRITE_TOKEN= # Vercel Blob 토큰
NEXT_PUBLIC_APP_URL=   # 앱 URL (QR 코드 생성용)

# 포스트잇 협업 보드 (padlet) 전용
PADLET_ADMIN_PASSWORD= # 포스트잇 협업 보드 관리자 로그인 비밀번호
AUTH_SECRET=           # 쿠키 서명 시크릿 (openssl rand -base64 32)
```

## DB 초기화 명령
```bash
pnpm db:push   # 스키마를 DB에 적용
```
pgvector 확장은 Neon에서 미리 활성화 필요:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 포스트잇 협업 보드 (padlet)
- 진입점: `/services/padlet`
- 관리자: `/services/padlet/admin` (비밀번호 로그인, `PADLET_ADMIN_PASSWORD` env로 설정)
- 공개 보드: `/services/padlet/b/[slug]` — 자유 캔버스(데스크탑) / 그리드(모바일)
- 익명 참여자는 닉네임 쿠키만으로 글/이미지/파일/링크 카드를 작성하고 이모지·댓글로 반응
- 관리자 인증 경로 보호는 `proxy.ts` (Next.js 16에서 `middleware`는 deprecated → `proxy` 권장)
- 의존성: `@dnd-kit/core`, `@dnd-kit/utilities`, `swr`, `nanoid`
- 새 의존성 또는 권한 변경 시: 환경변수에 `PADLET_ADMIN_PASSWORD`, `AUTH_SECRET` 필요

## 음성 누가기록 (nuga)
- 진입점: `/services/nuga` — 교사 1인용, 로그인 없음
- 흐름: 마이크 버튼 → 녹음(최대 15초) → `POST /api/nuga/transcribe` → 번호 파싱 → **확인 카드(생략 불가)** → 저장
- 저장소: **DB 없음**. `localStorage`의 `nuga.roster.v1`(명단) / `nuga.records.v1`(기록)만 사용
  - `lib/nuga-store.ts` — `useSyncExternalStore` 기반 (effect 안 setState 금지 룰 `react-hooks/set-state-in-effect` 대응)
  - `lib/nuga.ts` — 번호 파싱(숫자/한자어/고유어 수사), 명단 파싱, CSV, 로컬 날짜
- STT: `gpt-4o-mini-transcribe` (실패 시 `whisper-1` 폴백), `language: "ko"` + 교실 어휘 prompt 힌트
- 개인정보 원칙(반드시 유지):
  1. 교사는 **번호만** 말한다 → OpenAI로 나가는 것은 음성뿐, 학생 이름은 전송되지 않음
  2. 명단을 코드에 하드코딩하지 않는다 (앱의 「명단 등록」 화면에서 교사가 입력)
  3. 서버는 텍스트를 저장하지도 로그에 남기지도 않는다
  4. 「전체 기록 삭제」 버튼을 전체 보기 탭 하단 설정에 유지
- 번호 파싱 실패 시 **추측 금지** — 번호를 비운 채 확인 카드를 연다
- 기기 교체 시 기록이 사라지므로 CSV 내보내기(번호,이름,날짜,내용)는 필수 안전장치

## 문장 호응 체크 (hoeung)
- 명세: `docs/hoeung/SPEC.md` (5학년 국어 「문장 성분의 호응 관계」 공개수업 활동3용)
- 학생: `/services/hoeung` (방 코드·번호·이름) → `/services/hoeung/play` (PART1~4, 점 띠로 이동)
- 교사: `/services/hoeung/teacher` (방 만들기) → `/services/hoeung/teacher/[code]` (대시보드) → `.../tv` (익명 TV 화면)
- 문항: `data/hoeung-items.json` **에만** 둔다 (DB에 넣지 않음, 수정 후 배포). accept 정규식을 고치면 `node scripts/test-hoeung-judge.mjs` 로 확인
- AI 호출 없음. 판정은 클라이언트(`lib/hoeung/judge.ts`), 서버는 저장만
- PART3 accept 는 **특정 낱말이 아니라 호응 표지**(과거·높임·부정)를 적는다 — 빈칸에 올 서술어는 여러 가지("드신다"도 "시켜 주셨다"도 정답). 정규식으로 어려운 과거 시제는 `"@과거"`(ㅆ 받침 검사)를 쓴다
- 개인정보 원칙(반드시 유지): **이름은 서버로 보내지 않는다** — `localStorage`(`hoeung.session.v1`)에만 두고 DB에는 번호만 저장
- 오프라인 내성: 모든 입력은 `localStorage`에 먼저 쓰고 `lib/hoeung/store.ts`의 전송 큐(`hoeung.queue.v1`)로 순서대로 보낸다. 실패하면 5초 뒤·`online` 복귀 때 재전송. 큐를 다시 보내도 안전하도록 `tries`는 클라이언트 값을 그대로 저장
- 교사 인증: 로그인 없음. 방마다 `teacherKey`, `?k=`로 한 번 들어오면 `hoeung_k_[code]` 쿠키(httpOnly)에 저장
- 뱃지(`lib/hoeung/badge.ts`, 우선순위 순): STUCK(같은 문항 120초+, 신호 있을 때만) → WRONG2(정답 본 문항 미확인) → CHECK(PART3 확인 필요 미확인) → IDLE(60초 신호 없음)
  - STUCK과 IDLE을 구분하려고 명세의 스키마에 `HoeungStudent.currentItemSince`(현재 문항에 들어온 시각)를 추가함. `lastActiveAt`은 heartbeat마다 갱신
- 「정답 봄」(revealed) 뒤의 「다시 풀기」는 연습일 뿐 기록을 바꾸지 않는다. PART3 「확인 필요」는 다시 써서 정규식을 통과하면 「통과」로 바뀐다 (예시 답은 통과했거나 선생님과 확인한 뒤에만 보여 줌)
- 경쟁 요소(타이머·순위·점수판) 금지
