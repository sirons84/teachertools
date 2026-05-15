export interface BoardSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  bgColor: string;
}

export interface Attachment {
  id: string;
  type: "image" | "file" | "embed";
  url: string;
  filename: string | null;
  fileSize: number | null;
  mimeType: string | null;
  embedMeta: Record<string, unknown> | null;
}

export interface ReactionTally {
  [emoji: string]: { count: number; sessions: string[] };
}

export interface PostDto {
  id: string;
  nickname: string;
  sessionId: string;
  contentText: string | null;
  posX: number;
  posY: number;
  width: number;
  height: number;
  color: string;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  reactions: ReactionTally;
  commentCount: number;
}

export interface BoardData {
  board: BoardSummary;
  mySessionId: string | null;
  posts: PostDto[];
}

export interface CommentDto {
  id: string;
  nickname: string;
  sessionId: string;
  content: string;
  createdAt: string;
}
