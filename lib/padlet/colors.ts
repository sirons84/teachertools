// 포스트잇 팔레트
export const POST_COLORS = [
  { name: "yellow", value: "#FFF59D", label: "노랑" },
  { name: "pink",   value: "#F8BBD0", label: "분홍" },
  { name: "sky",    value: "#B3E5FC", label: "하늘" },
  { name: "green",  value: "#C5E1A5", label: "연두" },
  { name: "orange", value: "#FFCC80", label: "주황" },
  { name: "purple", value: "#D1C4E9", label: "보라" },
] as const;

export const POST_COLOR_VALUES: readonly string[] = POST_COLORS.map((c) => c.value);

export function isValidPostColor(v: unknown): v is string {
  return typeof v === "string" && POST_COLOR_VALUES.includes(v);
}

export function randomPostColor(): string {
  return POST_COLORS[Math.floor(Math.random() * POST_COLORS.length)].value;
}

// 보드 배경색 후보
export const BOARD_BG_COLORS = [
  { value: "#FAFAFA", label: "기본" },
  { value: "#FFF8E1", label: "크림" },
  { value: "#E3F2FD", label: "하늘" },
  { value: "#F3E5F5", label: "라일락" },
  { value: "#E8F5E9", label: "연초록" },
  { value: "#FBE9E7", label: "산호" },
] as const;
