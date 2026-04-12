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
```

## DB 초기화 명령
```bash
pnpm db:push   # 스키마를 DB에 적용
```
pgvector 확장은 Neon에서 미리 활성화 필요:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
