"use client";

import { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { PostDto } from "./types";
import { TextContent, AttachmentRenderer } from "./PostContent";
import ReactionBar from "./ReactionBar";
import CommentList from "./CommentList";
import { POST_COLORS } from "@/lib/padlet/colors";

interface Props {
  post: PostDto;
  mySessionId: string | null;
  myNickname: string | null;
  isAdmin?: boolean;
  isDragging?: boolean;
  onTopZ?: (id: string) => void;
  onEdit?: (post: PostDto) => void;
  onDeleted?: (id: string) => void;
  onMutated?: () => void;
  rotateDeg?: number;
  draggable?: boolean;
}

export default function PostCard({
  post,
  mySessionId,
  myNickname,
  isAdmin = false,
  onTopZ,
  onEdit,
  onDeleted,
  onMutated,
  rotateDeg = 0,
  draggable = true,
}: Props) {
  const mine = mySessionId === post.sessionId;
  const canDrag = draggable && (mine || isAdmin);
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: post.id,
    disabled: !canDrag,
  });

  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [lastPropCount, setLastPropCount] = useState(post.commentCount);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 상위에서 commentCount가 갱신되면 동기화 (React 권장: render 중 비교 후 setState)
  if (post.commentCount !== lastPropCount) {
    setLastPropCount(post.commentCount);
    setCommentCount(post.commentCount);
  }

  useEffect(() => {
    if (!showMenu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showMenu]);

  const dragStyle: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${rotateDeg}deg)`
      : `rotate(${rotateDeg}deg)`,
    zIndex: post.zIndex + 1,
  };

  const onDelete = async () => {
    if (!confirm("이 글을 삭제할까요?")) return;
    const endpoint = isAdmin && !mine
      ? `/api/padlet/admin/posts/${post.id}`
      : `/api/padlet/posts/${post.id}`;
    const res = await fetch(endpoint, { method: "DELETE" });
    if (res.ok) onDeleted?.(post.id);
  };

  const onColor = async (color: string) => {
    if (!mine) return;
    await fetch(`/api/padlet/posts/${post.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ color }),
    });
    onMutated?.();
    setShowMenu(false);
  };

  return (
    <article
      ref={setNodeRef}
      style={dragStyle}
      className={`select-none ${isDragging ? "opacity-80" : ""}`}
      onMouseDown={() => onTopZ?.(post.id)}
    >
      <div
        className="rounded-lg shadow-md hover:shadow-lg transition-shadow"
        style={{
          background: post.color,
          width: post.width,
        }}
      >
        {/* 헤더: 드래그 핸들 */}
        <div
          className={`px-3 pt-2 pb-1 flex items-center justify-between ${
            canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          }`}
          {...(canDrag ? listeners : {})}
          {...(canDrag ? attributes : {})}
        >
          <div className="text-[11px] font-semibold text-[#1E293B]/80 truncate">
            {post.nickname}
          </div>
          {(mine || isAdmin) && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((s) => !s);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="text-[#1E293B]/60 hover:text-[#1E293B] px-1.5 leading-none text-base"
                aria-label="메뉴"
              >
                ⋯
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 top-6 z-30 bg-white border border-gray-200 shadow-lg rounded-lg py-1 w-32 text-xs"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {mine && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onEdit?.(post);
                        }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-gray-50"
                      >
                        ✏️ 본문 수정
                      </button>
                      <div className="px-3 py-1.5">
                        <div className="text-gray-400 mb-1">색상</div>
                        <div className="flex flex-wrap gap-1">
                          {POST_COLORS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onColor(c.value);
                              }}
                              title={c.label}
                              className={`w-4 h-4 rounded-full border ${
                                post.color === c.value
                                  ? "ring-2 ring-blue-500 border-white"
                                  : "border-gray-200"
                              }`}
                              style={{ background: c.value }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="block w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600"
                  >
                    🗑 삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 본문 */}
        <div className="px-3 pb-2 space-y-2">
          {post.attachments.map((a) => (
            <AttachmentRenderer key={a.id} a={a} />
          ))}
          {post.contentText && <TextContent text={post.contentText} />}
        </div>

        {/* 반응바 */}
        <div className="px-2 pb-1.5">
          <ReactionBar
            postId={post.id}
            initial={post.reactions}
            mySessionId={mySessionId}
            onMutated={onMutated}
          />
        </div>

        {/* 댓글 토글 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowComments((s) => !s);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full text-left px-3 py-1.5 border-t border-white/40 text-xs text-[#1E293B]/70 hover:text-[#1E293B]"
        >
          💬 {commentCount}개 {showComments ? "닫기" : "보기"}
        </button>

        {showComments && (
          <div className="px-2 pb-2" onMouseDown={(e) => e.stopPropagation()}>
            <CommentList
              postId={post.id}
              mySessionId={mySessionId}
              myNickname={myNickname}
              onCountChange={(n) => setCommentCount(n)}
            />
          </div>
        )}
      </div>
    </article>
  );
}
