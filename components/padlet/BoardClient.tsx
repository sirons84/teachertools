"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { BoardData, BoardSummary, PostDto } from "./types";
import PostCard from "./PostCard";
import PostComposer from "./PostComposer";
import NicknameModal from "./NicknameModal";

const CANVAS_W = 3000;
const CANVAS_H = 2000;
const NICK_COOKIE = "pad_nick";

function readClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetcher(url: string): Promise<BoardData> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("불러오기 실패");
  return res.json();
}

// 카드별 안정된 회전값 (id 기반 해시)
function rotationForId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  // -2 ~ +2 deg
  return ((Math.abs(h) % 401) - 200) / 100;
}

export default function BoardClient({
  board,
  initialNickname,
  isAdmin,
}: {
  board: BoardSummary;
  initialNickname: string | null;
  isAdmin: boolean;
}) {
  const [nickname, setNickname] = useState<string | null>(initialNickname);
  const [showNickModal, setShowNickModal] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [editingPost, setEditingPost] = useState<PostDto | null>(null);
  const [mySessionId, setMySessionId] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  // dnd 진행 중 위치 저장 디바운스 타이머
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // SWR 폴링 (상호작용 중에는 정지)
  const { data, mutate } = useSWR<BoardData>(
    `/api/padlet/boards/${board.slug}`,
    fetcher,
    {
      refreshInterval: isInteracting ? 0 : 5000,
      revalidateOnFocus: true,
    }
  );

  // 닉네임 초기화: SSR에서 없으면 클라이언트 쿠키 한 번 더 확인 (변경 직후 새로고침 케이스)
  useEffect(() => {
    if (!nickname) {
      const cookieNick = readClientCookie(NICK_COOKIE);
      if (cookieNick) setNickname(cookieNick);
      else setShowNickModal(true);
    }
  }, [nickname]);

  // 모바일 감지
  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 세션 ID는 보드 GET 응답으로 받음 (서버가 본인 SID 쿠키 값을 그대로 반환)
  useEffect(() => {
    if (data?.mySessionId && data.mySessionId !== mySessionId) {
      setMySessionId(data.mySessionId);
    }
  }, [data?.mySessionId, mySessionId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  const onSetNickname = async (n: string) => {
    // 서버에 닉네임 쿠키 굽기 위해 빈 댓글 요청 대신, 클라 쿠키도 함께 굽고
    // 실제 서버 쿠키는 글/댓글 작성 시 setNickname()이 처리함
    document.cookie = `${NICK_COOKIE}=${encodeURIComponent(n)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setNickname(n);
    setShowNickModal(false);
  };

  const onDragStart = () => {
    setIsInteracting(true);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setIsInteracting(false);
    const id = String(e.active.id);
    const delta = e.delta;
    if (!delta || (delta.x === 0 && delta.y === 0)) return;
    if (!data) return;
    const target = data.posts.find((p) => p.id === id);
    if (!target) return;
    const nextX = Math.max(0, Math.min(CANVAS_W - target.width, target.posX + delta.x));
    const nextY = Math.max(0, Math.min(CANVAS_H - target.height, target.posY + delta.y));

    // 옵티미스틱
    mutate(
      {
        ...data,
        posts: data.posts.map((p) =>
          p.id === id ? { ...p, posX: nextX, posY: nextY } : p
        ),
      },
      { revalidate: false }
    );

    // 디바운스 저장
    const existing = saveTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(async () => {
      await fetch(`/api/padlet/posts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ posX: nextX, posY: nextY }),
      });
      mutate();
    }, 300);
    saveTimers.current.set(id, t);
  };

  const onTopZ = (id: string) => {
    if (!data) return;
    const maxZ = data.posts.reduce((m, p) => Math.max(m, p.zIndex), 0);
    const target = data.posts.find((p) => p.id === id);
    if (!target || target.zIndex === maxZ) return;
    const nextZ = maxZ + 1;
    mutate(
      {
        ...data,
        posts: data.posts.map((p) => (p.id === id ? { ...p, zIndex: nextZ } : p)),
      },
      { revalidate: false }
    );
    fetch(`/api/padlet/posts/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ zIndex: nextZ }),
    });
  };

  const onPostDeleted = (id: string) => {
    if (!data) return;
    mutate(
      { ...data, posts: data.posts.filter((p) => p.id !== id) },
      { revalidate: true }
    );
  };

  const posts = data?.posts ?? [];

  // 새 글 위치 — composer를 여는 시점에 1회 계산
  const [composerPos, setComposerPos] = useState<{ x: number; y: number } | null>(null);
  const openComposer = (post: PostDto | null) => {
    setEditingPost(post);
    if (typeof window !== "undefined") {
      setComposerPos({
        x: Math.floor(
          window.scrollX + window.innerWidth / 2 - 120 + (Math.random() - 0.5) * 200
        ),
        y: Math.floor(
          window.scrollY + window.innerHeight / 2 - 100 + (Math.random() - 0.5) * 200
        ),
      });
    } else {
      setComposerPos({ x: 1200, y: 800 });
    }
    setShowComposer(true);
  };

  return (
    <div className="w-full" style={{ background: board.bgColor }}>
      {/* 툴바 */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-bold text-[#1E293B] truncate flex items-center gap-1.5">
              <span>📌</span>
              <span>{board.title}</span>
              {isAdmin && (
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">
                  관리자
                </span>
              )}
            </h1>
            {board.description && (
              <p className="text-xs text-gray-500 truncate">{board.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {nickname && (
              <button
                onClick={() => setShowNickModal(true)}
                className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
              >
                🙂 {nickname} <span className="text-gray-400">변경</span>
              </button>
            )}
            <button
              onClick={() => openComposer(null)}
              disabled={!nickname}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <span>＋</span>
              <span>새 글</span>
            </button>
          </div>
        </div>
      </div>

      {/* 캔버스 또는 모바일 그리드 */}
      {mobile ? (
        <div className="max-w-2xl mx-auto px-4 py-6 grid grid-cols-1 gap-4">
          {posts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">
              아직 글이 없습니다. 첫 글을 올려보세요!
            </p>
          ) : (
            posts.map((p) => (
              <div key={p.id} className="relative">
                <PostCardMobileWrapper
                  post={p}
                  mySessionId={mySessionId}
                  myNickname={nickname}
                  isAdmin={isAdmin}
                  onEdit={(post) => openComposer(post)}
                  onDeleted={onPostDeleted}
                  onMutated={refresh}
                />
              </div>
            ))
          )}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="overflow-auto" style={{ height: "calc(100vh - 8rem)" }}>
            <div
              className="relative"
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                background: board.bgColor,
                backgroundImage:
                  "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            >
              {posts.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
                  아직 글이 없습니다. 우측 상단의 “＋ 새 글” 버튼으로 시작하세요!
                </div>
              )}
              {posts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    position: "absolute",
                    left: p.posX,
                    top: p.posY,
                    zIndex: p.zIndex,
                  }}
                >
                  <PostCard
                    post={p}
                    mySessionId={mySessionId}
                    myNickname={nickname}
                    isAdmin={isAdmin}
                    rotateDeg={rotationForId(p.id)}
                    onTopZ={onTopZ}
                    onEdit={(post) => {
                      setEditingPost(post);
                      setShowComposer(true);
                    }}
                    onDeleted={onPostDeleted}
                    onMutated={refresh}
                  />
                </div>
              ))}
            </div>
          </div>
        </DndContext>
      )}

      {showNickModal && (
        <NicknameModal
          initialValue={nickname ?? ""}
          onSubmit={onSetNickname}
          cancellable={!!nickname}
          onCancel={() => setShowNickModal(false)}
        />
      )}

      {showComposer && nickname && (
        <PostComposer
          boardSlug={board.slug}
          initialNickname={nickname}
          initialPosX={composerPos?.x}
          initialPosY={composerPos?.y}
          existingPost={
            editingPost
              ? {
                  id: editingPost.id,
                  contentText: editingPost.contentText,
                  color: editingPost.color,
                  attachments: editingPost.attachments,
                }
              : undefined
          }
          onClose={() => {
            setShowComposer(false);
            setEditingPost(null);
          }}
          onCreated={() => {
            setShowComposer(false);
            setEditingPost(null);
            refresh();
          }}
          onNicknameChange={(n) => setNickname(n)}
        />
      )}
    </div>
  );
}

// 모바일 그리드용 - 드래그 비활성, 정적 배치
function PostCardMobileWrapper(props: {
  post: PostDto;
  mySessionId: string | null;
  myNickname: string | null;
  isAdmin: boolean;
  onEdit: (p: PostDto) => void;
  onDeleted: (id: string) => void;
  onMutated: () => void;
}) {
  return (
    <PostCard
      post={{ ...props.post, width: 320 }}
      mySessionId={props.mySessionId}
      myNickname={props.myNickname}
      isAdmin={props.isAdmin}
      rotateDeg={0}
      draggable={false}
      onTopZ={() => {}}
      onEdit={props.onEdit}
      onDeleted={props.onDeleted}
      onMutated={props.onMutated}
    />
  );
}
