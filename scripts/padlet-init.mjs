// 일회성: 패들렛 5개 테이블을 Neon에 직접 추가
// 사용: node --env-file=.env.local scripts/padlet-init.mjs
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL 누락");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
CREATE TABLE IF NOT EXISTS "PadletBoard" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "bgColor" TEXT NOT NULL DEFAULT '#FAFAFA',
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PadletBoard_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PadletBoard_slug_key" ON "PadletBoard"("slug");
CREATE INDEX IF NOT EXISTS "PadletBoard_isArchived_createdAt_idx" ON "PadletBoard"("isArchived", "createdAt");

CREATE TABLE IF NOT EXISTS "PadletPost" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "nickname" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "contentText" TEXT,
  "posX" INTEGER NOT NULL DEFAULT 0,
  "posY" INTEGER NOT NULL DEFAULT 0,
  "width" INTEGER NOT NULL DEFAULT 240,
  "height" INTEGER NOT NULL DEFAULT 200,
  "color" TEXT NOT NULL DEFAULT '#FFF59D',
  "zIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PadletPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PadletPost_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "PadletBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PadletPost_boardId_createdAt_idx" ON "PadletPost"("boardId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PadletPost_sessionId_idx" ON "PadletPost"("sessionId");

CREATE TABLE IF NOT EXISTS "PadletAttachment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "filename" TEXT,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "embedMeta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PadletAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PadletAttachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PadletPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PadletAttachment_postId_idx" ON "PadletAttachment"("postId");

CREATE TABLE IF NOT EXISTS "PadletReaction" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PadletReaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PadletReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PadletPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PadletReaction_postId_sessionId_emoji_key" ON "PadletReaction"("postId", "sessionId", "emoji");
CREATE INDEX IF NOT EXISTS "PadletReaction_postId_idx" ON "PadletReaction"("postId");

CREATE TABLE IF NOT EXISTS "PadletComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "nickname" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PadletComment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PadletComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PadletPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PadletComment_postId_createdAt_idx" ON "PadletComment"("postId", "createdAt");
`;

try {
  await pool.query(SQL);
  const r = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE 'Padlet%'
    ORDER BY table_name
  `);
  console.log("생성 확인:", r.rows.map((x) => x.table_name).join(", "));
  await pool.end();
} catch (err) {
  console.error("실행 실패:", err.message);
  process.exit(1);
}
